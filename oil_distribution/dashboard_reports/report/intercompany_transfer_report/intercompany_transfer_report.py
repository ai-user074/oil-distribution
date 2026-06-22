import frappe


def execute(filters=None):
	if not filters:
		filters = {}

	fields = [
		"ict.name as transfer",
		"ict.company as from_company",
		"ict.to_company as to_company",
		"ict.posting_date",
		"ict.status",
		"ict.grand_total",
	]

	conditions = ""
	if filters.get("from_company"):
		conditions += " and ict.company = %(from_company)s"
	if filters.get("to_company"):
		conditions += " and ict.to_company = %(to_company)s"
	if filters.get("posting_date"):
		if isinstance(filters["posting_date"], (list, tuple)) and len(filters["posting_date"]) == 2:
			conditions += " and ict.posting_date between %(posting_date_from)s and %(posting_date_to)s"
			filters["posting_date_from"] = filters["posting_date"][0]
			filters["posting_date_to"] = filters["posting_date"][1]
		else:
			conditions += " and ict.posting_date = %(posting_date)s"

	query = """
		select {fields}
		from `tabInter Company Transfer` ict
		where ict.docstatus = 1 {conditions}
		order by ict.posting_date desc
	""".format(
		fields=", ".join(fields),
		conditions=conditions,
	)

	data = frappe.db.sql(query, filters, as_dict=True)

	columns = [
		{"label": "Transfer", "fieldname": "transfer", "fieldtype": "Link", "options": "Inter Company Transfer", "width": 180},
		{"label": "From", "fieldname": "from_company", "fieldtype": "Link", "options": "Company", "width": 180},
		{"label": "To", "fieldname": "to_company", "fieldtype": "Link", "options": "Company", "width": 180},
		{"label": "Posting Date", "fieldname": "posting_date", "fieldtype": "Date", "width": 130},
		{"label": "Status", "fieldname": "status", "width": 120},
		{"label": "Amount", "fieldname": "grand_total", "fieldtype": "Currency", "width": 120},
	]

	return columns, data
