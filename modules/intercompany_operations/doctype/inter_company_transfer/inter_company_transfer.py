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
		self.status = "Submitted"

	def on_submit(self):
		self.create_intercompany_documents()

	def on_cancel(self):
		self.cancel_generated_documents()
		self.status = "Cancelled"
		self.db_update()

	def cancel_generated_documents(self):
		for row in self.generated_documents:
			if row.document_name and row.docstatus == 1:
				try:
					doc = frappe.get_doc(row.document_type, row.document_name)
					doc.cancel()
					row.docstatus = 2
					# document cancelled successfully
				except Exception as e:
					frappe.throw(
						_("Failed to cancel linked {0} {1}: {2}").format(row.document_type, row.document_name, str(e))
					)
		self.flags.ignore_permissions = True
		self.save()

	def create_intercompany_documents(self):
		if self.transaction_type != "Inter Company Stock Transfer":
			return

		if not self.items:
			frappe.throw(_("Please add at least one item in the transfer"))

		self.clear_linked_docs()
		self.create_linked_document("Sales Order")
		self.create_linked_document("Purchase Order")
		self.create_linked_document("Delivery Note")
		self.create_linked_document("Purchase Receipt")

		self.status = "Transfer Created"
		self.flags.ignore_permissions = True
		self.save()

	def clear_linked_docs(self):
		self.set("generated_documents", [])

	def create_linked_document(self, doctype):
		if doctype not in ["Sales Order", "Purchase Order", "Delivery Note", "Purchase Receipt"]:
			return

		field_map = {
			"Sales Order": "inter_company_order_reference",
			"Purchase Order": "inter_company_order_reference",
			"Delivery Note": "inter_company_reference",
			"Purchase Receipt": "inter_company_reference",
		}

		reference_field = field_map.get(doctype)
		if doctype == "Sales Order":
			from erpnext.selling.doctype.sales_order.sales_order import make_inter_company_purchase_order as make_doc
			doc = make_doc(self.name)
			doc.company = self.company
			doc.customer = self.get_internal_customer()
			doc.currency = frappe.get_cached_value("Company", self.company, "default_currency")
			doc.set_warehouse = self.items[0].source_warehouse if self.items else None
			if not doc.set_warehouse:
				for item in self.items:
					if item.source_warehouse:
						item.warehouse = item.source_warehouse
			for item in doc.items:
				item.rate = flt(item.rate) or self.get_transfer_rate(item.item_code)
				if item.get("warehouse") is None and item.get("set_warehouse") is None and self.items:
					for transfer_item in self.items:
						if transfer_item.item_code == item.item_code:
							item.warehouse = transfer_item.source_warehouse
							break
			if doc.selling_price_list:
				doc.selling_price_list = doc.selling_price_list
			doc.flags.ignore_inter_company_validation = 1
			doc.run_method("set_missing_values")
			doc.run_method("calculate_taxes_and_totals")
			doc.save(ignore_permissions=True)
			self.append("generated_documents", {
				"document_type": doctype,
				"document_name": doc.name,
				"company": doc.company,
				"status": doc.docstatus,
				"creation": doc.creation,
			})

		if doctype == "Purchase Order":
			from erpnext.buying.doctype.purchase_order.purchase_order import make_inter_company_sales_order as make_doc
			doc = make_doc(self.name)
			to_company_doc = frappe.get_cached_doc("Company", self.to_company)
			doc.company = self.to_company
			doc.supplier = self.get_internal_supplier()
			doc.currency = to_company_doc.default_currency
			doc.set_warehouse = self.items[0].target_warehouse if self.items else None
			for item in doc.items:
				if item.get("from_warehouse") is None and self.items:
					for transfer_item in self.items:
						if transfer_item.item_code == item.item_code:
							item.from_warehouse = transfer_item.target_warehouse
							break
			doc.flags.ignore_inter_company_validation = 1
			doc.run_method("set_missing_values")
			doc.run_method("calculate_taxes_and_totals")
			doc.save(ignore_permissions=True)
			self.append("generated_documents", {
				"document_type": doctype,
				"document_name": doc.name,
				"company": doc.company,
				"status": doc.docstatus,
				"creation": doc.creation,
			})

		if doctype == "Delivery Note":
			so_name = self.get_latest_doc("Sales Order")
			if not so_name:
				frappe.throw(_("Linked Sales Order not found for Delivery Note creation"))
			from erpnext.stock.doctype.sales_order.sales_order import make_delivery_note
			doc = make_delivery_note(so_name)
			doc.company = self.company
			for item in doc.items:
				if item.get("target_warehouse") is None and self.items:
					for transfer_item in self.items:
						if transfer_item.item_code == item.item_code:
							item.target_warehouse = getattr(transfer_item, "target_warehouse", None) or transfer_item.source_warehouse
							break
			doc.flags.ignore_inter_company_validation = 1
			doc.run_method("set_missing_values")
			doc.save(ignore_permissions=True)
			doc.submit()
			self.append("generated_documents", {
				"document_type": doctype,
				"document_name": doc.name,
				"company": doc.company,
				"status": doc.docstatus,
				"creation": doc.creation,
			})

		if doctype == "Purchase Receipt":
			dn_name = self.get_latest_doc("Delivery Note")
			if not dn_name:
				frappe.throw(_("Linked Delivery Note not found for Purchase Receipt creation"))
			from erpnext.stock.doctype.delivery_note.delivery_note import make_inter_company_purchase_receipt
			doc = make_inter_company_purchase_receipt(dn_name)
			doc.company = self.to_company
			for item in doc.items:
				if not item.warehouse:
					for transfer_item in self.items:
						if transfer_item.item_code == item.item_code:
							item.warehouse = getattr(transfer_item, "target_warehouse", None) or transfer_item.source_warehouse
							break
			from erpnext.controllers.stock_controller import update_incoming_rate_from_contiguous_transactions
			doc.flags.ignore_inter_company_validation = 1
			doc.run_method("set_missing_values")
			doc.flags.ignore_validate_price_list = True
			doc.submit()
			self.append("generated_documents", {
				"document_type": doctype,
				"document_name": doc.name,
				"company": doc.company,
				"status": doc.docstatus,
				"creation": doc.creation,
			})

		self.set_status_after_document_creation()

	def get_internal_customer(self):
		customer = frappe.db.get_value(
			"Customer",
			{"disabled": 0, "is_internal_customer": 1, "represents_company": self.to_company},
			"name",
		)
		if not customer:
			frappe.throw(_("No Internal Customer found representing company {0}").format(self.to_company))
		return customer

	def get_internal_supplier(self):
		supplier = frappe.db.get_value(
			"Supplier",
			{"disabled": 0, "is_internal_supplier": 1, "represents_company": self.company},
			"name",
		)
		if not supplier:
			frappe.throw(_("No Internal Supplier found representing company {0}").format(self.company))
		return supplier

	def get_transfer_rate(self, item_code):
		rate = flt(frappe.db.get_value(
			"Item Price",
			{"item_code": item_code, "selling": 1, "price_list": frappe.get_cached_value("Selling Settings", None, "selling_price_list") or "Standard Selling"},
			"price_list_rate",
		))
		return rate

	def get_latest_doc(self, doctype):
		return frappe.db.get_value(
			self.doctype + " Generated Document",
			{"parent": self.name, "document_type": doctype},
			"document_name",
			order_by="creation desc",
		)

	def set_status_after_document_creation(self):
		self.status = "Transfer Created"
		self.flags.ignore_permissions = True
		self.save()
