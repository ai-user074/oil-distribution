import frappe
from frappe.utils import flt
from collections import defaultdict


def execute(filters=None):
	if not filters:
		filters = {}

	fields = [
		"sr.name as reservation",
		"sr.company",
		"sr.warehouse",
		"sr.item",
		"sr.reserved_qty",
		"sr.reserved_for",
		"sr.posting_date",
		"sr.status",
		"sr.sales_order",
		"sr.stock_entry",
	]

	conditions = ""
	if filters.get("company"):
		conditions += " and sr.company = %(company)s"
	if filters.get("warehouse"):
		conditions += " and sr.warehouse = %(warehouse)s"
	if filters.get("item"):
		conditions += " and sr.item = %(item)s"
	if filters.get("status"):
		conditions += " and sr.status = %(status)s"

	query = """
		select {fields}
		from `tabStock Reservation` sr
		where sr.docstatus = 1 {conditions}
		order by sr.posting_date desc
	""".format(
		fields=", ".join(fields),
		conditions=conditions,
	)

	data = frappe.db.sql(query, filters, as_dict=True)

	columns = [
		{"label": "Reservation", "fieldname": "reservation", "fieldtype": "Link", "options": "Stock Reservation", "width": 180},
		{"label": "Company", "fieldname": "company", "fieldtype": "Link", "options": "Company", "width": 180},
		{"label": "Warehouse", "fieldname": "warehouse", "fieldtype": "Link", "options": "Warehouse", "width": 180},
		{"label": "Item", "fieldname": "item", "fieldtype": "Link", "options": "Item", "width": 150},
		{"label": "Reserved Qty", "fieldname": "reserved_qty", "fieldtype": "Float", "width": 120},
		{"label": "Reserved For", "fieldname": "reserved_for", "width": 150},
		{"label": "Date", "fieldname": "posting_date", "fieldtype": "Date", "width": 120},
		{"label": "Status", "fieldname": "status", "width": 120},
		{"label": "Sales Order", "fieldname": "sales_order", "fieldtype": "Link", "options": "Sales Order", "width": 150},
		{"label": "Stock Entry", "fieldname": "stock_entry", "fieldtype": "Link", "options": "Stock Entry", "width": 150},
	]

	# Chart: Reserved qty by company (bar)
	company_reserved = defaultdict(float)
	for row in data:
		company_reserved[row.company] += flt(row.reserved_qty)

	chart = None
	if company_reserved:
		chart = {
			"data": {
				"labels": list(company_reserved.keys()),
				"datasets": [{"name": "Reserved Qty", "values": list(company_reserved.values())}],
			},
			"type": "bar",
		}

	# Pie chart for status distribution
	status_counts = defaultdict(int)
	for row in data:
		status_counts[row.status or "Reserved"] += 1

	pie_chart = None
	if status_counts:
		pie_chart = {
			"data": {
				"labels": list(status_counts.keys()),
				"datasets": [{"name": "Reservations", "values": list(status_counts.values())}],
			},
			"type": "pie",
		}

	# Report summary
	total_reservations = len(data)
	total_qty = sum(flt(r.reserved_qty) for r in data)
	active = sum(1 for r in data if r.status == "Reserved")
	released = sum(1 for r in data if r.status == "Released")

	report_summary = [
		{"label": "Total Reservations", "value": total_reservations, "indicator": "blue"},
		{"label": "Total Reserved Qty", "value": total_qty, "indicator": "orange"},
		{"label": "Active", "value": active, "indicator": "green"},
		{"label": "Released", "value": released, "indicator": "red"},
	]

	return columns, data, None, chart, report_summary
