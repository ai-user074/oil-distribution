import frappe
from frappe.utils import flt, today, getdate, get_first_day


def _get_company():
    return frappe.form_dict.get("company", "All") or "All"


@frappe.whitelist()
def get_stock_kpis():
    """Key metrics for stock dashboard."""
    company = _get_company()
    co_filter = ""
    co_args = []
    if company != "All":
        co_filter = "AND w.company = %s"
        co_args = [company]

    # Total available stock
    avail = frappe.db.sql(
        """SELECT COALESCE(SUM(b.actual_qty), 0) as qty, COALESCE(SUM(b.stock_value), 0) as val
        FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE w.name LIKE 'Available WH - %%' AND b.actual_qty > 0 """ + co_filter,
        tuple(co_args), as_dict=True,
    )

    # Total reserved stock (Swastik)
    reserved = frappe.db.sql(
        """SELECT COALESCE(SUM(b.actual_qty), 0) as qty, COALESCE(SUM(b.stock_value), 0) as val
        FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE w.name LIKE 'Reserved WH - %%' AND b.actual_qty > 0 """ + co_filter,
        tuple(co_args), as_dict=True,
    )

    # Negative stock count
    neg = frappe.db.sql(
        """SELECT COUNT(*) as cnt FROM `tabBin` b
        JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE b.actual_qty < 0 """ + co_filter,
        tuple(co_args), as_dict=True,
    )

    # Total items in stock
    items = frappe.db.sql(
        """SELECT COUNT(DISTINCT b.item_code) as cnt FROM `tabBin` b
        JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE b.actual_qty > 0 """ + co_filter,
        tuple(co_args), as_dict=True,
    )

    # Total warehouses with stock
    wh_count = frappe.db.sql(
        """SELECT COUNT(DISTINCT w.name) as cnt FROM `tabBin` b
        JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE b.actual_qty > 0 """ + co_filter,
        tuple(co_args), as_dict=True,
    )

    a_qty = flt(avail[0].qty) if avail else 0
    a_val = flt(avail[0].val) if avail else 0
    r_qty = flt(reserved[0].qty) if reserved else 0
    r_val = flt(reserved[0].val) if reserved else 0

    return {
        "available_qty": a_qty,
        "available_value": a_val,
        "reserved_qty": r_qty,
        "reserved_value": r_val,
        "total_stock": a_qty + r_qty,
        "total_value": a_val + r_val,
        "negative_count": int(neg[0].cnt) if neg else 0,
        "items_count": int(items[0].cnt) if items else 0,
        "warehouse_count": int(wh_count[0].cnt) if wh_count else 0,
        "utilization_pct": ((r_qty / (a_qty + r_qty)) * 100) if (a_qty + r_qty) > 0 else 0,
    }


@frappe.whitelist()
def get_stock_by_company():
    """Stock breakdown by company for charts and tables."""
    company = _get_company()
    co_filter = ""
    co_args = []
    if company != "All":
        co_filter = "AND w.company = %s"
        co_args = [company]

    data = frappe.db.sql(
        """SELECT w.company,
            SUM(CASE WHEN w.name LIKE 'Available WH - %%' THEN b.actual_qty ELSE 0 END) as avail_qty,
            SUM(CASE WHEN w.name LIKE 'Available WH - %%' THEN b.stock_value ELSE 0 END) as avail_val,
            SUM(CASE WHEN w.name LIKE 'Reserved WH - %%' THEN b.actual_qty ELSE 0 END) as reserved_qty,
            SUM(CASE WHEN w.name LIKE 'Reserved WH - %%' THEN b.stock_value ELSE 0 END) as reserved_val,
            SUM(b.actual_qty) as total_qty,
            SUM(b.stock_value) as total_value,
            COUNT(DISTINCT b.item_code) as item_count
        FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE b.actual_qty > 0 """ + co_filter + """
        GROUP BY w.company ORDER BY total_value DESC""",
        tuple(co_args), as_dict=True,
    )
    return data


@frappe.whitelist()
def get_stock_by_warehouse():
    """Stock breakdown by warehouse."""
    company = _get_company()
    co_filter = ""
    co_args = []
    if company != "All":
        co_filter = "AND w.company = %s"
        co_args = [company]

    data = frappe.db.sql(
        """SELECT w.name as warehouse, w.company, w.warehouse_type,
            SUM(b.actual_qty) as total_qty,
            SUM(b.stock_value) as total_value,
            COUNT(DISTINCT b.item_code) as item_count
        FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE b.actual_qty != 0 AND w.name LIKE '%% WH - %%' """ + co_filter + """
        GROUP BY w.name ORDER BY w.company, total_value DESC""",
        tuple(co_args), as_dict=True,
    )
    return data


@frappe.whitelist()
def get_stock_by_item():
    """Item-wise stock summary across companies."""
    company = _get_company()
    co_filter = ""
    co_args = []
    if company != "All":
        co_filter = "AND w.company = %s"
        co_args = [company]

    data = frappe.db.sql(
        """SELECT b.item_code, w.company,
            SUM(b.actual_qty) as qty,
            SUM(b.stock_value) as value
        FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE b.actual_qty != 0 """ + co_filter + """
        GROUP BY b.item_code, w.company
        ORDER BY b.item_code, value DESC""",
        tuple(co_args), as_dict=True,
    )

    items = {}
    for row in data:
        ic = row.item_code
        if ic not in items:
            items[ic] = {"item_code": ic, "companies": {}, "total_qty": 0, "total_value": 0}
        co = row.company
        items[ic]["companies"][co] = {"qty": flt(row.qty), "value": flt(row.value)}
        items[ic]["total_qty"] += flt(row.qty)
        items[ic]["total_value"] += flt(row.value)

    return sorted(items.values(), key=lambda x: x["total_value"], reverse=True)


@frappe.whitelist()
def get_swastik_detail():
    """Detailed Swastik reserved stock."""
    company = _get_company()
    co_filter = ""
    co_args = []
    if company != "All":
        co_filter = "AND w.company = %s"
        co_args = [company]

    total = frappe.db.sql(
        """SELECT COALESCE(SUM(b.actual_qty), 0) as qty, COALESCE(SUM(b.stock_value), 0) as val
        FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE w.name LIKE 'Reserved WH - %%' AND b.actual_qty > 0 """ + co_filter,
        tuple(co_args), as_dict=True,
    )

    by_company = frappe.db.sql(
        """SELECT w.company, SUM(b.actual_qty) as qty, SUM(b.stock_value) as val
        FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE w.name LIKE 'Reserved WH - %%' AND b.actual_qty > 0 """ + co_filter + """
        GROUP BY w.company ORDER BY val DESC""",
        tuple(co_args), as_dict=True,
    )

    by_item = frappe.db.sql(
        """SELECT b.item_code, SUM(b.actual_qty) as qty, SUM(b.stock_value) as val
        FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE w.name LIKE 'Reserved WH - %%' AND b.actual_qty > 0 """ + co_filter + """
        GROUP BY b.item_code ORDER BY val DESC""",
        tuple(co_args), as_dict=True,
    )

    detail = frappe.db.sql(
        """SELECT w.company, b.item_code, b.warehouse, b.actual_qty as qty, b.stock_value as val
        FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE w.name LIKE 'Reserved WH - %%' AND b.actual_qty > 0 """ + co_filter + """
        ORDER BY w.company, b.item_code""",
        tuple(co_args), as_dict=True,
    )

    return {
        "total_qty": flt(total[0].qty) if total else 0,
        "total_value": flt(total[0].val) if total else 0,
        "companies_count": len(by_company),
        "items_count": len(by_item),
        "by_company": by_company,
        "by_item": by_item,
        "detail": detail,
    }


@frappe.whitelist()
def get_negative_stock():
    """Get negative stock items."""
    company = _get_company()
    co_filter = ""
    co_args = []
    if company != "All":
        co_filter = "AND w.company = %s"
        co_args = [company]

    return frappe.db.sql(
        """SELECT w.company, w.name as warehouse, b.item_code, b.actual_qty, b.stock_value
        FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE b.actual_qty < 0 """ + co_filter + """
        ORDER BY b.actual_qty ASC LIMIT 20""",
        tuple(co_args), as_dict=True,
    )
