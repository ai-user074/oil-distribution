import frappe
from frappe.utils import flt


def execute(filters=None):
	if not filters:
		filters = {}

	columns = [
		{"label": "Purchase Order", "fieldname": "name", "fieldtype": "Link", "options": "Purchase Order", "width": 180},
		{"label": "Supplier", "fieldname": "supplier", "fieldtype": "Link", "options": "Supplier", "width": 180},
		{"label": "Company", "fieldname": "company", "fieldtype": "Link", "options": "Company", "width": 200},
		{"label": "Transaction Date", "fieldname": "transaction_date", "fieldtype": "Date", "width": 120},
		{"label": "Status", "fieldname": "status", "fieldtype": "Data", "width": 120},
		{"label": "Grand Total", "fieldname": "grand_total", "fieldtype": "Currency", "width": 140},
	]

	conditions = ""
	if filters.get("company"):
		conditions += " and po.company = %(company)s"
	if filters.get("supplier"):
		conditions += " and po.supplier = %(supplier)s"
	if filters.get("from_date"):
		conditions += " and po.transaction_date >= %(from_date)s"
	if filters.get("to_date"):
		conditions += " and po.transaction_date <= %(to_date)s"

	data = frappe.db.sql(
		"""
		select
			po.name,
			po.supplier,
			po.company,
			po.transaction_date,
			po.status,
			po.grand_total
		from `tabPurchase Order` po
		where po.docstatus = 1
		{conditions}
		order by po.transaction_date desc
		""".format(conditions=conditions),
		filters,
		as_dict=True,
	)

	return columns, data
