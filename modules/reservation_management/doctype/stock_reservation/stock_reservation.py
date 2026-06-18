import frappe
from frappe import _
from frappe.utils import flt, nowdate


class StockReservation(frappe.model.Document):
	def validate(self):
		self.set_missing_values()
		self.validate_warehouse_company()

	def set_missing_values(self):
		if not self.posting_date:
			self.posting_date = nowdate()

		if not self.stock_uom and self.item:
			self.stock_uom = frappe.get_cached_value("Item", self.item, "stock_uom")

		if not self.status:
			self.status = "Draft"

	def validate_warehouse_company(self):
		if self.warehouse and self.company:
			warehouse_company = frappe.get_cached_value("Warehouse", self.warehouse, "company")
			if warehouse_company != self.company:
				frappe.throw(_("Warehouse does not belong to selected company"))

	def before_submit(self):
		self.validate_reserved_qty()
		self.status = "Reserved"

	def on_submit(self):
		self.update_stock_ledger(reserve=True)

	def on_cancel(self):
		self.status = "Cancelled"
		self.update_stock_ledger(reserve=False)
		self.db_update()

	def validate_reserved_qty(self):
		if not self.reserved_qty:
			frappe.throw(_("Reserved Qty is mandatory"))

		if self.reserved_qty <= 0:
			frappe.throw(_("Reserved Qty must be greater than 0"))

		available_qty = (
			frappe.db.get_value("Bin", {"item_code": self.item, "warehouse": self.warehouse}, "actual_qty") or 0
		)

		if flt(available_qty) < flt(self.reserved_qty):
			frappe.throw(_("Not enough stock in {0}. Available: {1}").format(self.warehouse, available_qty))

	def update_stock_ledger(self, reserve=True):
		if not self.item or not self.warehouse or not self.company:
			return

		if self.stock_entry:
			if not reserve:
				stock_entry = frappe.get_doc("Stock Entry", self.stock_entry)
				stock_entry.flags.ignore_permissions = True
				stock_entry.cancel()
				self.db_set("stock_entry", "")
			return

		if reserve:
			reserved_warehouse = frappe.get_cached_value("Company", self.company, "custom_reserved_warehouse")
			if not reserved_warehouse:
				frappe.throw(
					_("Please set Reserved Warehouse on Company master for company {0}").format(self.company)
				)

			stock_entry = frappe.new_doc("Stock Entry")
			stock_entry.stock_entry_type = "Material Transfer"
			stock_entry.company = self.company
			stock_entry.append(
				"items",
				{
					"item_code": self.item,
					"s_warehouse": self.warehouse,
					"t_warehouse": reserved_warehouse,
					"qty": self.reserved_qty,
					"basic_rate": 0,
					"uom": self.stock_uom,
				},
			)
			stock_entry.flags.ignore_permissions = True
			stock_entry.submit()
			self.db_set("stock_entry", stock_entry.name)
		else:
			reserved_warehouse = frappe.get_cached_value("Company", self.company, "custom_reserved_warehouse")
			if reserved_warehouse:
				stock_entry = frappe.new_doc("Stock Entry")
				stock_entry.stock_entry_type = "Material Transfer"
				stock_entry.company = self.company
				stock_entry.append(
					"items",
					{
						"item_code": self.item,
						"s_warehouse": reserved_warehouse,
						"t_warehouse": self.warehouse,
						"qty": self.reserved_qty,
						"basic_rate": 0,
						"uom": self.stock_uom,
					},
				)
				stock_entry.flags.ignore_permissions = True
				stock_entry.submit()
				self.db_set("stock_entry", stock_entry.name)

	def release_reservation(self):
		if self.docstatus != 1:
			frappe.throw(_("Only submitted reservation can be released"))

		self.status = "Released"
		self.update_stock_ledger(reserve=False)
		self.db_update()
