import frappe


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

	query = """
		select {fields}
		from `tabStock Reservation` sr
		where sr.docstatus = 1 {company_filter}
		order by sr.posting_date desc
	""".format(
		fields=", ".join(fields),
		company_filter=" and sr.company = %(company)s" if filters.get("company") else "",
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

	return columns, data
