import frappe
from frappe import _
from frappe.utils import flt, nowdate

from erpnext.controllers.stock_controller import StockController


class InterCompanyTransfer(StockController):
	def validate(self):
		self.validate_values()
		self.calculate_totals()

	def validate_values(self):
		if self.company == self.to_company:
			frappe.throw(_("From Company and To Company cannot be the same"))

		for item in self.items:
			item.from_warehouse = item.source_warehouse
			item.to_warehouse = item.target_warehouse
			item.qty = flt(item.qty)
			item.rate = flt(item.rate)
			item.amount = flt(item.amount) or flt(item.qty) * flt(item.rate)

	def calculate_totals(self):
		self.total_qty = 0
		self.total = 0

		for item in self.items:
			self.total_qty += item.qty
			self.total += item.amount

		self.base_grand_total = self.total
		self.grand_total = self.total

	def before_submit(self):
		self.validate_values()
		if not self.items:
			frappe.throw(_("Please add at least one item in the transfer"))
		self.status = "Submitted"

	def on_submit(self):
		try:
			self.create_intercompany_documents()
		except Exception as e:
			frappe.log_error(
				title=f"ICT Submit Failed: {self.name}",
				message=str(e),
			)
			frappe.throw(
				_("Failed to create inter-company documents: {0}").format(str(e))
			)

	def on_cancel(self):
		self.cancel_generated_documents()
		self.flags.ignore_permissions = True
		self.db_set("status", "Cancelled")

	def cancel_generated_documents(self):
		cancel_order = [
			"Payment Entry", "Purchase Receipt", "Delivery Note",
			"Purchase Order", "Sales Order",
		]
		for doctype in cancel_order:
			for row in self.generated_documents:
				if row.document_type == doctype and row.document_name and row.docstatus == 1:
					try:
						doc = frappe.get_doc(row.document_type, row.document_name)
						doc.flags.ignore_links = True
						doc.flags.ignore_permissions = True
						doc.amended_from = doc.name
						doc.cancel()
						row.docstatus = 2
					except Exception as e:
						frappe.log_error(
							title="ICT Cancel Failed",
							message=f"Failed to cancel {doctype} {row.document_name}: {e}",
						)

		self.flags.ignore_permissions = True
		frappe.db.set_value(self.doctype, self.name, "status", "Cancelled")

	def create_intercompany_documents(self):
		if self.transaction_type != "Inter Company Stock Transfer":
			return

		if not self.items:
			frappe.throw(_("Please add at least one item in the transfer"))

		self.clear_linked_docs()

		# Step 1: Create Sales Order (from source company)
		so = self.create_sales_order()
		so_name = so.name

		# Step 2: Create Purchase Order from SO
		po = self.create_purchase_order_from_so(so_name)
		po_name = po.name

		# Step 3: Create Delivery Note from SO
		dn = self.create_delivery_note_from_so(so_name)
		dn_name = dn.name

		# Step 4: Create Purchase Receipt from DN, linked to PO
		pr = self.create_purchase_receipt_from_dn(dn_name, po_name)
		pr_name = pr.name

		# Step 5: Create Payment Entries for both companies
		self.create_payment_entries(so_name, po_name)

		self.status = "Transfer Created"
		self.flags.ignore_permissions = True
		self.db_set("status", "Transfer Created")
		self.save()

	def clear_linked_docs(self):
		self.set("generated_documents", [])

	def create_sales_order(self):
		"""Create a Sales Order from the source company (seller) to the destination company (buyer)."""
		customer = self.get_internal_customer(self.to_company)

		so = frappe.new_doc("Sales Order")
		so.company = self.company
		so.customer = customer
		so.transaction_date = self.posting_date
		so.delivery_date = self.posting_date
		so.currency = frappe.get_cached_value("Company", self.company, "default_currency") or "INR"
		so.ignore_pricing_rule = 1

		for transfer_item in self.items:
			so.append("items", {
				"item_code": transfer_item.item_code,
				"qty": transfer_item.qty,
				"rate": transfer_item.rate,
				"warehouse": transfer_item.source_warehouse,
				"delivery_date": self.posting_date,
			})

		if self.sales_tax_template:
			self.apply_tax_template(so, self.sales_tax_template, self.company)

		so.flags.ignore_inter_company_validation = 1
		so.flags.ignore_permissions = True
		so.flags.ignore_links = True
		so.run_method("set_missing_values")
		so.run_method("calculate_taxes_and_totals")
		so.save(ignore_permissions=True)
		so.submit()

		self.append_generated_doc("Sales Order", so.name, so.company, so.docstatus, so.transaction_date, so.grand_total)
		return so

	def create_purchase_order_from_so(self, so_name):
		"""Create Purchase Order for the buying company using ERPNext's inter-company API."""
		from erpnext.selling.doctype.sales_order.sales_order import make_inter_company_purchase_order

		po = make_inter_company_purchase_order(so_name)
		po.company = self.to_company
		po.supplier = self.get_internal_supplier(self.company)
		po.currency = frappe.get_cached_value("Company", self.to_company, "default_currency") or "INR"

		for item in po.items:
			for transfer_item in self.items:
				if transfer_item.item_code == item.item_code:
					item.warehouse = transfer_item.target_warehouse
					if transfer_item.batch_no:
						item.batch_no = transfer_item.batch_no
					break
			if not item.schedule_date:
				item.schedule_date = self.posting_date

		po.flags.ignore_inter_company_validation = 1
		po.flags.ignore_permissions = True
		po.run_method("set_missing_values")

		if self.purchase_tax_template:
			self.apply_tax_template(po, self.purchase_tax_template, self.to_company)

		po.run_method("calculate_taxes_and_totals")
		po.save(ignore_permissions=True)
		po.submit()

		self.append_generated_doc("Purchase Order", po.name, po.company, po.docstatus, po.transaction_date, po.grand_total)
		return po

	def create_delivery_note_from_so(self, so_name):
		"""Create Delivery Note from Sales Order and submit it."""
		from erpnext.selling.doctype.sales_order.sales_order import make_delivery_note

		dn = make_delivery_note(so_name)
		dn.company = self.company

		for item in dn.items:
			for transfer_item in self.items:
				if transfer_item.item_code == item.item_code:
					item.target_warehouse = transfer_item.target_warehouse
					item.warehouse = transfer_item.source_warehouse
					if transfer_item.batch_no:
						item.batch_no = transfer_item.batch_no
					break

		dn.flags.ignore_inter_company_validation = 1
		dn.flags.ignore_permissions = True
		dn.run_method("set_missing_values")
		dn.save(ignore_permissions=True)
		dn.submit()

		self.append_generated_doc("Delivery Note", dn.name, dn.company, dn.docstatus, dn.posting_date, dn.grand_total)
		return dn

	def create_purchase_receipt_from_dn(self, dn_name, po_name):
		"""Create Purchase Receipt from Delivery Note, linked to Purchase Order."""
		from erpnext.stock.doctype.delivery_note.delivery_note import make_inter_company_purchase_receipt

		pr = make_inter_company_purchase_receipt(dn_name)
		pr.company = self.to_company

		for item in pr.items:
			for transfer_item in self.items:
				if transfer_item.item_code == item.item_code:
					item.warehouse = transfer_item.target_warehouse
					if transfer_item.batch_no:
						item.batch_no = transfer_item.batch_no
					break
			# Link PR item to PO so received_qty updates
			item.purchase_order = po_name

		pr.flags.ignore_inter_company_validation = 1
		pr.flags.ignore_permissions = True
		pr.run_method("set_missing_values")
		pr.save(ignore_permissions=True)
		pr.submit()

		self.append_generated_doc("Purchase Receipt", pr.name, pr.company, pr.docstatus, pr.posting_date, pr.grand_total)
		return pr

	def create_payment_entries(self, so_name, po_name):
		"""Create Payment Entry for seller (against SO) and buyer (against PO)."""
		# Payment 1: Buyer (to_company) pays to Seller (from_company)
		self.create_payment_entry(
			company=self.to_company,
			party_type="Supplier",
			party=self.get_internal_supplier(self.company),
			payment_type="Pay",
			reference_doctype="Purchase Order",
			reference_name=po_name,
		)

		# Payment 2: Seller (from_company) receives from Buyer (to_company)
		self.create_payment_entry(
			company=self.company,
			party_type="Customer",
			party=self.get_internal_customer(self.to_company),
			payment_type="Receive",
			reference_doctype="Sales Order",
			reference_name=so_name,
		)

	def create_payment_entry(self, company, party_type, party, payment_type, reference_doctype, reference_name):
		"""Create a single Payment Entry using bank accounts (no receivable/payable)."""
		pe = frappe.new_doc("Payment Entry")
		pe.company = company
		pe.payment_type = payment_type
		pe.party_type = party_type
		pe.party = party
		pe.posting_date = self.posting_date
		pe.mode_of_payment = frappe.db.get_value("Mode of Payment", {"type": "Bank"}, "name") or "Bank Transfer"
		pe.paid_amount = self.grand_total
		pe.received_amount = self.grand_total
		pe.source_exchange_rate = 1
		pe.target_exchange_rate = 1
		pe.reference_no = self.name
		pe.reference_date = self.posting_date

		# Use bank accounts for both sides (avoids receivable/payable party validation)
		default_bank = frappe.db.get_value("Company", company, "default_bank_account")
		if not default_bank:
			frappe.throw(_("No default Bank Account set for company {0}").format(company))

		# Both paid_from and paid_to use bank accounts for internal transfers
		pe.paid_from = default_bank
		pe.paid_to = default_bank

		pe.append("references", {
			"reference_doctype": reference_doctype,
			"reference_name": reference_name,
			"total_amount": self.grand_total,
			"outstanding_amount": self.grand_total,
			"allocated_amount": self.grand_total,
		})

		pe.flags.ignore_permissions = True
		pe.flags.ignore_links = True
		pe.save(ignore_permissions=True)
		pe.submit()

		self.append_generated_doc("Payment Entry", pe.name, pe.company, pe.docstatus, self.posting_date, pe.paid_amount)
		return pe

	def append_generated_doc(self, doctype, name, company, docstatus, posting_date=None, grand_total=0):
		status_map = {0: "Draft", 1: "Submitted", 2: "Cancelled"}
		self.append("generated_documents", {
			"document_type": doctype,
			"document_name": name,
			"company": company,
			"status": status_map.get(docstatus, "Draft"),
			"posting_date": posting_date or self.posting_date,
			"grand_total": grand_total,
			"creation": frappe.utils.now(),
		})

	def apply_tax_template(self, doc, template_name, company):
		if doc.doctype == "Sales Order":
			tax_doctype = "Sales Taxes and Charges Template"
		else:
			tax_doctype = "Purchase Taxes and Charges Template"

		template = frappe.db.get_value(tax_doctype, {"company": company}, "name")
		if not template:
			template = template_name

		if template:
			tmpl = frappe.get_doc(tax_doctype, template)
			doc.taxes = []
			for row in tmpl.taxes:
				doc.append("taxes", {
					"charge_type": row.charge_type,
					"account_head": row.account_head,
					"rate": row.rate,
					"description": row.description,
				})

	def get_internal_customer(self, company):
		customer = frappe.db.get_value(
			"Customer",
			{"disabled": 0, "is_internal_customer": 1, "represents_company": company},
			"name",
		)
		if not customer:
			frappe.throw(_("No Internal Customer found representing company {0}").format(company))
		return customer

	def get_internal_supplier(self, company):
		supplier = frappe.db.get_value(
			"Supplier",
			{"disabled": 0, "is_internal_supplier": 1, "represents_company": company},
			"name",
		)
		if not supplier:
			frappe.throw(_("No Internal Supplier found representing company {0}").format(company))
		return supplier

	def get_transfer_rate(self, item_code):
		return flt(frappe.db.get_value(
			"Item Price",
			{"item_code": item_code, "selling": 1, "price_list": frappe.get_cached_value("Selling Settings", None, "selling_price_list") or "Standard Selling"},
			"price_list_rate",
		))

	def get_latest_doc(self, doctype):
		return frappe.db.get_value(
			self.doctype + " Generated Document",
			{"parent": self.name, "document_type": doctype},
			"document_name",
			order_by="creation desc",
		)
