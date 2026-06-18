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

	data = frappe.db.sql(
		"""
		select
			tb.company,
			tb.warehouse,
			tb.item_code,
			tb.qty,
			tb.valuation_rate,
			tb.stock_value
		from (
			select
				w.company,
				b.warehouse,
				b.item_code,
				b.actual_qty as qty,
				b.valuation_rate,
				(b.actual_qty * b.valuation_rate) as stock_value
			from `tabBin` b
			join `tabWarehouse` w on w.name = b.warehouse
		) tb
		order by tb.company, tb.warehouse, tb.item_code
		""",
		as_dict=True,
	)

	return columns, data
