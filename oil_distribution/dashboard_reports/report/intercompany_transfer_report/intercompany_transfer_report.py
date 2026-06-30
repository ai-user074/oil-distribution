import frappe
from frappe.utils import flt
from collections import defaultdict


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

	# Chart: Transfer value by company pair (bar)
	company_pair_totals = defaultdict(float)
	for row in data:
		key = f"{row.from_company} -> {row.to_company}"
		company_pair_totals[key] += flt(row.grand_total)

	chart = None
	if company_pair_totals:
		chart = {
			"data": {
				"labels": list(company_pair_totals.keys()),
				"datasets": [{"name": "Transfer Value", "values": list(company_pair_totals.values())}],
			},
			"type": "bar",
		}

	# Pie chart for status distribution
	status_counts = defaultdict(int)
	for row in data:
		status_counts[row.status or "Draft"] += 1

	pie_chart = None
	if status_counts:
		pie_chart = {
			"data": {
				"labels": list(status_counts.keys()),
				"datasets": [{"name": "Transfers", "values": list(status_counts.values())}],
			},
			"type": "pie",
		}

	# Report summary
	total_transfers = len(data)
	total_value = sum(flt(r.grand_total) for r in data)

	report_summary = [
		{"label": "Total Transfers", "value": total_transfers, "indicator": "blue"},
		{"label": "Total Value", "value": frappe.utils.fmt_money(total_value), "indicator": "green"},
	]

	return columns, data, None, chart, report_summary
