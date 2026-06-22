import frappe
from frappe import _


class TransferSettings(frappe.model.document.Document):
	def validate(self):
		self.validate_warehouses()

	def validate_warehouses(self):
		if self.default_source_warehouse and self.company:
			wh_company = frappe.get_cached_value("Warehouse", self.default_source_warehouse, "company")
			if wh_company != self.company:
				frappe.throw(_("Default Source Warehouse does not belong to the selected company"))

		if self.default_target_warehouse and self.company:
			wh_company = frappe.get_cached_value("Warehouse", self.default_target_warehouse, "company")
			if wh_company != self.company:
				frappe.throw(_("Default Target Warehouse does not belong to the selected company"))
