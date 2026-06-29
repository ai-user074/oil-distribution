import frappe
from frappe.utils import flt


def execute(filters=None):
	if not filters:
		filters = {}

	columns = [
		{"label": "Company", "fieldname": "company", "fieldtype": "Link", "options": "Company", "width": 200},
		{"label": "Warehouse", "fieldname": "warehouse", "fieldtype": "Link", "options": "Warehouse", "width": 200},
		{"label": "Item", "fieldname": "item_code", "fieldtype": "Link", "options": "Item", "width": 150},
		{"label": "Qty", "fieldname": "qty", "fieldtype": "Float", "width": 120},
		{"label": "Valuation Rate", "fieldname": "valuation_rate", "fieldtype": "Currency", "width": 140},
		{"label": "Stock Value", "fieldname": "stock_value", "fieldtype": "Currency", "width": 140},
	]

	conditions = ""
	if filters.get("company"):
		conditions += " and w.company = %(company)s"
	if filters.get("warehouse"):
		conditions += " and b.warehouse = %(warehouse)s"
	if filters.get("item_code"):
		conditions += " and b.item_code = %(item_code)s"

	data = frappe.db.sql(
		"""
		select
			w.company,
			b.warehouse,
			b.item_code,
			b.actual_qty as qty,
			b.valuation_rate,
			(b.actual_qty * b.valuation_rate) as stock_value
		from `tabBin` b
		join `tabWarehouse` w on w.name = b.warehouse
		where b.actual_qty != 0
		{conditions}
		order by w.company, b.warehouse, b.item_code
		""".format(conditions=conditions),
		filters,
		as_dict=True,
	)

	return columns, data
