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
		{"label": "Available Qty", "fieldname": "available_qty", "fieldtype": "Float", "width": 120},
		{"label": "Reserved Qty", "fieldname": "reserved_qty", "fieldtype": "Float", "width": 120},
		{"label": "Net Available", "fieldname": "net_available", "fieldtype": "Float", "width": 120},
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
			b.actual_qty as available_qty,
			ifnull(r.reserved_qty, 0) as reserved_qty,
			(b.actual_qty - ifnull(r.reserved_qty, 0)) as net_available
		from `tabBin` b
		join `tabWarehouse` w on w.name = b.warehouse
		left join (
			select item as item_code, warehouse, sum(reserved_qty) as reserved_qty
			from `tabStock Reservation`
			where docstatus = 1 and status = 'Reserved'
			group by item, warehouse
		) r on r.item_code = b.item_code and r.warehouse = b.warehouse
		where b.actual_qty > 0
		{conditions}
		order by w.company, b.warehouse, b.item_code
		""".format(conditions=conditions),
		filters,
		as_dict=True,
	)

	# Chart: Available vs Reserved by company (bar, grouped)
	company_data = defaultdict(lambda: {"available": 0, "reserved": 0})
	for row in data:
		company_data[row.company]["available"] += flt(row.available_qty)
		company_data[row.company]["reserved"] += flt(row.reserved_qty)

	chart = None
	if company_data:
		chart = {
			"data": {
				"labels": list(company_data.keys()),
				"datasets": [
					{"name": "Available", "values": [v["available"] for v in company_data.values()]},
					{"name": "Reserved", "values": [v["reserved"] for v in company_data.values()]},
				],
			},
			"type": "bar",
		}

	# Report summary
	total_available = sum(flt(r.available_qty) for r in data)
	total_reserved = sum(flt(r.reserved_qty) for r in data)
	total_net = sum(flt(r.net_available) for r in data)

	report_summary = [
		{"label": "Total Available", "value": total_available, "indicator": "green"},
		{"label": "Total Reserved", "value": total_reserved, "indicator": "orange"},
		{"label": "Net Available", "value": total_net, "indicator": "blue"},
	]

	return columns, data, None, chart, report_summary
