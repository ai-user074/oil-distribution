import frappe
from frappe import _
from frappe.utils import flt, nowdate


class StockReservation(frappe.model.document.Document):
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
			frappe.msgprint(
				_("Warning: Source warehouse {0} will go negative. Available: {1}, Requested: {2}").format(
					self.warehouse, available_qty, self.reserved_qty
				),
				indicator="orange",
				alert=True,
			)

	def get_reserved_warehouse(self):
		"""Get the Reserved WH for this company based on naming convention."""
		company_abbr = frappe.get_cached_value("Company", self.company, "abbr")
		reserved_wh = f"Reserved WH - {company_abbr}"
		if not frappe.db.exists("Warehouse", reserved_wh):
			frappe.throw(
				_("Reserved Warehouse '{0}' not found for company {1}").format(reserved_wh, self.company)
			)
		return reserved_wh

	def update_stock_ledger(self, reserve=True):
		if not self.item or not self.warehouse or not self.company:
			return

		if self.stock_entry:
			if not reserve:
				se = frappe.get_doc("Stock Entry", self.stock_entry)
				se.flags.ignore_permissions = True
				se.flags.ignore_links = True
				se.cancel()
				self.db_set("stock_entry", "")
			return

		if reserve:
			reserved_warehouse = self.get_reserved_warehouse()

			stock_entry = frappe.new_doc("Stock Entry")
			stock_entry.stock_entry_type = "Material Transfer"
			stock_entry.purpose = "Material Transfer"
			stock_entry.company = self.company
			basic_rate = self.get_valuation_rate()
			item_data = {
				"item_code": self.item,
				"s_warehouse": self.warehouse,
				"t_warehouse": reserved_warehouse,
				"qty": self.reserved_qty,
				"basic_rate": basic_rate,
				"uom": self.stock_uom,
			}
			if self.batch_no:
				item_data["batch_no"] = self.batch_no
			stock_entry.append("items", item_data)
			stock_entry.flags.ignore_permissions = True
			stock_entry.flags.ignore_links = True
			stock_entry.submit()
			self.db_set("stock_entry", stock_entry.name)
		else:
			reserved_warehouse = self.get_reserved_warehouse()

			stock_entry = frappe.new_doc("Stock Entry")
			stock_entry.stock_entry_type = "Material Transfer"
			stock_entry.purpose = "Material Transfer"
			stock_entry.company = self.company
			basic_rate = self.get_valuation_rate()
			item_data = {
				"item_code": self.item,
				"s_warehouse": reserved_warehouse,
				"t_warehouse": self.warehouse,
				"qty": self.reserved_qty,
				"basic_rate": basic_rate,
				"uom": self.stock_uom,
			}
			if self.batch_no:
				item_data["batch_no"] = self.batch_no
			stock_entry.append("items", item_data)
			stock_entry.flags.ignore_permissions = True
			stock_entry.flags.ignore_links = True
			stock_entry.submit()
			self.db_set("stock_entry", stock_entry.name)

	def get_valuation_rate(self):
		bin_rate = frappe.db.get_value(
			"Bin", {"item_code": self.item, "warehouse": self.warehouse}, "valuation_rate"
		)
		if bin_rate:
			return flt(bin_rate)
		return flt(frappe.db.get_value("Item", self.item, "valuation_rate") or 0)

	def release_reservation(self):
		if self.docstatus != 1:
			frappe.throw(_("Only submitted reservation can be released"))

		if self.status == "Released":
			frappe.throw(_("Reservation is already released"))

		self.status = "Released"
		self.update_stock_ledger(reserve=False)
		self.db_update()

	@frappe.whitelist()
	def get_swastik_total_reserved(self):
		"""Get total reserved stock from all Reserved Warehouses (actual Bin stock)."""
		total = frappe.db.sql(
			"""
			SELECT COALESCE(SUM(b.actual_qty), 0)
			FROM `tabBin` b
			JOIN `tabWarehouse` w ON w.name = b.warehouse
			WHERE w.name LIKE 'Reserved WH - %%'
			AND b.actual_qty > 0
			""",
			as_dict=False,
		)
		return flt(total[0][0]) if total else 0

	@staticmethod
	def recalculate_all_swastik_totals():
		"""Recalculate total_reserved_for_swastik from actual Bin stock in Reserved Warehouses.
		Counts ALL stock (manual transfers + reservation transfers)."""
		total = frappe.db.sql(
			"""
			SELECT COALESCE(SUM(b.actual_qty), 0)
			FROM `tabBin` b
			JOIN `tabWarehouse` w ON w.name = b.warehouse
			WHERE w.name LIKE 'Reserved WH - %%'
			AND b.actual_qty > 0
			""",
			as_dict=False,
		)
		total_val = flt(total[0][0]) if total else 0
		frappe.db.sql(
			"UPDATE `tabStock Reservation` SET total_reserved_for_swastik = %s WHERE docstatus = 1 AND status = 'Reserved'",
			(total_val,),
		)
		frappe.db.commit()


def recalculate_on_change(doc, method):
	"""doc_events hook: recalculate swastik totals when any Stock Reservation is submitted/cancelled."""
	StockReservation.recalculate_all_swastik_totals()
