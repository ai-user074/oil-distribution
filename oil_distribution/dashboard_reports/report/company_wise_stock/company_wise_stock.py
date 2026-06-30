import frappe
from frappe.utils import flt
from collections import defaultdict


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

	# Chart: Stock value by company (bar)
	company_values = defaultdict(float)
	company_qty = defaultdict(float)
	for row in data:
		company_values[row.company] += flt(row.stock_value)
		company_qty[row.company] += flt(row.qty)

	chart = None
	if company_values:
		chart = {
			"data": {
				"labels": list(company_values.keys()),
				"datasets": [
					{"name": "Stock Qty", "values": list(company_qty.values())},
				],
			},
			"type": "bar",
		}

	# Pie chart for stock value by company
	pie_chart = None
	if company_values:
		pie_chart = {
			"data": {
				"labels": list(company_values.keys()),
				"datasets": [{"name": "Stock Value", "values": list(company_values.values())}],
			},
			"type": "pie",
		}

	# Report summary
	total_qty = sum(flt(r.qty) for r in data)
	total_value = sum(flt(r.stock_value) for r in data)
	total_items = len(set(r.item_code for r in data))

	report_summary = [
		{"label": "Total Qty", "value": total_qty, "indicator": "blue"},
		{"label": "Total Value", "value": frappe.utils.fmt_money(total_value), "indicator": "green"},
		{"label": "Unique Items", "value": total_items, "indicator": "orange"},
	]

	return columns, data, None, chart, report_summary
