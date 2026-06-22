import frappe
from frappe.utils import cstr


def daily_negative_stock_report():
    """Send daily negative stock alert email."""
    try:
        data = frappe.db.sql(
            """
            select w.company, b.warehouse, b.item_code, b.actual_qty
            from tabBin b join tabWarehouse w on w.name = b.warehouse
            where b.actual_qty < 0
            """,
            as_dict=True,
        )
        if data:
            body = "<h3>Negative Stock Alert</h3><table border=1>"
            body += "<tr><th>Company</th><th>Warehouse</th><th>Item</th><th>Qty</th></tr>"
            for r in data:
                body += "<tr><td>{0}</td><td>{1}</td><td>{2}</td><td>{3}</td></tr>".format(
                    frappe.utils.cstr(frappe.utils.escape_html(r.company)),
                    frappe.utils.cstr(frappe.utils.escape_html(r.warehouse)),
                    frappe.utils.cstr(frappe.utils.escape_html(r.item_code)),
                    r.actual_qty,
                )
            body += "</table>"
            recipients = frappe.db.get_single_value("Transfer Settings", "notification_email")
            if recipients:
                frappe.sendmail(
                    recipients=recipients.split(","),
                    subject="Negative Stock Alert",
                    message=body,
                )
    except Exception as e:
        frappe.log_error(title="Daily Negative Stock Report", message=str(e))


def email_reserved_stock_report():
    """Email reserved stock summary."""
    try:
        data = frappe.db.sql(
            """
            select sr.company, sr.item, sr.reserved_qty, sr.reserved_for, sr.status
            from `tabStock Reservation` sr
            where sr.docstatus = 1 and sr.status = 'Reserved'
            """,
            as_dict=True,
        )
        if data:
            body = "<h3>Reserved Stock Report</h3><table border=1>"
            body += "<tr><th>Company</th><th>Item</th><th>Reserved Qty</th><th>Reserved For</th><th>Status</th></tr>"
            for r in data:
                body += "<tr><td>{0}</td><td>{1}</td><td>{2}</td><td>{3}</td><td>{4}</td></tr>".format(
                    frappe.utils.cstr(frappe.utils.escape_html(r.company)),
                    frappe.utils.cstr(frappe.utils.escape_html(r.item)),
                    r.reserved_qty,
                    frappe.utils.cstr(frappe.utils.escape_html(r.reserved_for)),
                    frappe.utils.cstr(frappe.utils.escape_html(r.status)),
                )
            body += "</table>"
            recipients = frappe.db.get_single_value("Transfer Settings", "notification_email")
            if recipients:
                frappe.sendmail(
                    recipients=recipients.split(","),
                    subject="Reserved Stock Report",
                    message=body,
                )
    except Exception as e:
        frappe.log_error(title="Email Reserved Stock Report", message=str(e))
