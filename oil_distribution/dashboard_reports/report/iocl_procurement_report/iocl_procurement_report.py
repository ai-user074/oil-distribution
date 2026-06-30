import frappe
from frappe.utils import flt


def execute(filters=None):
	if not filters:
		filters = {}

	columns = [
		{"label": "Purchase Order", "fieldname": "name", "fieldtype": "Link", "options": "Purchase Order", "width": 180},
		{"label": "Company", "fieldname": "company", "fieldtype": "Link", "options": "Company", "width": 180},
		{"label": "Date", "fieldname": "transaction_date", "fieldtype": "Date", "width": 110},
		{"label": "Item", "fieldname": "item_code", "fieldtype": "Link", "options": "Item", "width": 130},
		{"label": "PO Qty", "fieldname": "po_qty", "fieldtype": "Float", "width": 100},
		{"label": "Received Qty", "fieldname": "received_qty", "fieldtype": "Float", "width": 120},
		{"label": "Pending Qty", "fieldname": "pending_qty", "fieldtype": "Float", "width": 110},
		{"label": "Rate", "fieldname": "rate", "fieldtype": "Currency", "width": 100},
		{"label": "PO Amount", "fieldname": "po_amount", "fieldtype": "Currency", "width": 130},
		{"label": "Received Amount", "fieldname": "received_amount", "fieldtype": "Currency", "width": 140},
		{"label": "Pending Amount", "fieldname": "pending_amount", "fieldtype": "Currency", "width": 130},
		{"label": "Receipt %", "fieldname": "receipt_pct", "fieldtype": "Percent", "width": 100},
		{"label": "Status", "fieldname": "status", "fieldtype": "Data", "width": 110},
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
			po.company,
			po.transaction_date,
			po.status,
			poi.item_code,
			poi.qty as po_qty,
			ifnull(poi.received_qty, 0) as received_qty,
			(poi.qty - ifnull(poi.received_qty, 0)) as pending_qty,
			poi.rate,
			poi.amount as po_amount,
			(ifnull(poi.received_qty, 0) * poi.rate) as received_amount,
			((poi.qty - ifnull(poi.received_qty, 0)) * poi.rate) as pending_amount,
			if(poi.qty > 0, (ifnull(poi.received_qty, 0) / poi.qty * 100), 0) as receipt_pct
		from `tabPurchase Order` po
		join `tabPurchase Order Item` poi on poi.parent = po.name
		where po.docstatus = 1
		{conditions}
		order by po.transaction_date desc, po.name
		""".format(conditions=conditions),
		filters,
		as_dict=True,
	)

	# Chart: PO Qty vs Received Qty by PO (bar)
	po_labels = [r.name for r in data]
	po_chart = None
	if data:
		po_chart = {
			"data": {
				"labels": po_labels,
				"datasets": [
					{"name": "PO Qty", "values": [flt(r.po_qty) for r in data]},
					{"name": "Received Qty", "values": [flt(r.received_qty) for r in data]},
				],
			},
			"type": "bar",
		}

	# Report summary
	total_po_qty = sum(flt(r.po_qty) for r in data)
	total_received = sum(flt(r.received_qty) for r in data)
	total_pending = sum(flt(r.pending_qty) for r in data)
	total_po_amount = sum(flt(r.po_amount) for r in data)
	total_received_amount = sum(flt(r.received_amount) for r in data)
	total_pending_amount = sum(flt(r.pending_amount) for r in data)
	overall_pct = (total_received / total_po_qty * 100) if total_po_qty > 0 else 0

	report_summary = [
		{"label": "Total PO Qty", "value": total_po_qty, "indicator": "blue"},
		{"label": "Received Qty", "value": total_received, "indicator": "green"},
		{"label": "Pending Qty", "value": total_pending, "indicator": "orange" if total_pending > 0 else "green"},
		{"label": "PO Amount", "value": frappe.utils.fmt_money(total_po_amount), "indicator": "blue"},
		{"label": "Received Amount", "value": frappe.utils.fmt_money(total_received_amount), "indicator": "green"},
		{"label": "Pending Amount", "value": frappe.utils.fmt_money(total_pending_amount), "indicator": "orange" if total_pending_amount > 0 else "green"},
		{"label": "Receipt %", "value": f"{overall_pct:.1f}%", "indicator": "green" if overall_pct >= 100 else "orange"},
	]

	return columns, data, None, po_chart, report_summary
