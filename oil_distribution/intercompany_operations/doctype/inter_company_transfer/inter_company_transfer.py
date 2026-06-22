import frappe
from frappe import _
from frappe.utils import flt

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
		# Cancel in reverse order: PR -> DN -> PO -> SO
		cancel_order = ["Purchase Receipt", "Delivery Note", "Purchase Order", "Sales Order"]
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

		# Step 2: Create Purchase Order from SO (for buying company)
		po = self.create_purchase_order_from_so(so_name)

		# Step 3: Create Delivery Note from SO (submit immediately)
		dn = self.create_delivery_note_from_so(so_name)
		dn_name = dn.name

		# Step 4: Create Purchase Receipt from DN (submit immediately)
		pr = self.create_purchase_receipt_from_dn(dn_name)

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

		self.append_generated_doc("Sales Order", so.name, so.company, so.docstatus)
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

		self.append_generated_doc("Purchase Order", po.name, po.company, po.docstatus)
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

		self.append_generated_doc("Delivery Note", dn.name, dn.company, dn.docstatus)
		return dn

	def create_purchase_receipt_from_dn(self, dn_name):
		"""Create Purchase Receipt from Delivery Note and submit it."""
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

		pr.flags.ignore_inter_company_validation = 1
		pr.flags.ignore_permissions = True
		pr.run_method("set_missing_values")
		pr.save(ignore_permissions=True)
		pr.submit()

		self.append_generated_doc("Purchase Receipt", pr.name, pr.company, pr.docstatus)
		return pr

	def append_generated_doc(self, doctype, name, company, docstatus):
		status_map = {0: "Draft", 1: "Submitted", 2: "Cancelled"}
		self.append("generated_documents", {
			"document_type": doctype,
			"document_name": name,
			"company": company,
			"status": status_map.get(docstatus, "Draft"),
			"creation": frappe.utils.now(),
		})

	def apply_tax_template(self, doc, template_name, company):
		"""Apply tax template - find matching template for the document's company."""
		if doc.doctype == "Sales Order":
			tax_doctype = "Sales Taxes and Charges Template"
		else:
			tax_doctype = "Purchase Taxes and Charges Template"

		# Try to find a template that belongs to this company
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
