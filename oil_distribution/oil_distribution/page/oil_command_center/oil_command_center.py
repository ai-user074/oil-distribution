import frappe
from frappe.utils import flt, today, getdate, get_first_day, add_months


@frappe.whitelist()
def get_kpis():
    """Return all 6 KPI values for the dashboard."""
    result = {
        "sales_mtd": 0,
        "procurement_mtd": 0,
        "available_stock": 0,
        "reserved_stock": 0,
        "negative_alerts": 0,
        "intercompany_volume": 0,
    }

    # Sales MTD
    sales = frappe.db.sql(
        """
        SELECT COALESCE(SUM(base_grand_total), 0) as total
        FROM `tabSales Invoice`
        WHERE docstatus = 1
        AND posting_date >= %s
        """,
        (get_first_day(today()),),
        as_dict=True,
    )
    result["sales_mtd"] = flt(sales[0].total) if sales else 0

    # Procurement MTD
    purchase = frappe.db.sql(
        """
        SELECT COALESCE(SUM(base_grand_total), 0) as total
        FROM `tabPurchase Invoice`
        WHERE docstatus = 1
        AND posting_date >= %s
        """,
        (get_first_day(today()),),
        as_dict=True,
    )
    result["procurement_mtd"] = flt(purchase[0].total) if purchase else 0

    # Available Stock
    avail = frappe.db.sql(
        """
        SELECT COALESCE(SUM(b.actual_qty), 0) as qty
        FROM `tabBin` b
        JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE w.name LIKE 'Available WH - %%'
        AND b.actual_qty > 0
        """,
        as_dict=True,
    )
    result["available_stock"] = flt(avail[0].qty) if avail else 0

    # Reserved Stock
    reserved = frappe.db.sql(
        """
        SELECT COALESCE(SUM(b.actual_qty), 0) as qty
        FROM `tabBin` b
        JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE w.name LIKE 'Reserved WH - %%'
        AND b.actual_qty > 0
        """,
        as_dict=True,
    )
    result["reserved_stock"] = flt(reserved[0].qty) if reserved else 0

    # Negative Stock Alerts
    neg = frappe.db.sql(
        """
        SELECT COUNT(*) as cnt
        FROM `tabBin` b
        JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE b.actual_qty < 0
        """,
        as_dict=True,
    )
    result["negative_alerts"] = int(neg[0].cnt) if neg else 0

    # Intercompany Volume (ICT submitted this month)
    ict = frappe.db.sql(
        """
        SELECT COALESCE(SUM(total_qty), 0) as qty
        FROM `tabInter Company Transfer`
        WHERE docstatus = 1
        AND posting_date >= %s
        """,
        (get_first_day(today()),),
        as_dict=True,
    )
    result["intercompany_volume"] = flt(ict[0].qty) if ict else 0

    return result


@frappe.whitelist()
def get_sales_procurement_trend():
    """Sales vs Procurement last 6 months."""
    from frappe.utils import add_months, formatdate

    months = []
    sales_data = []
    purchase_data = []

    for i in range(5, -1, -1):
        dt = add_months(today(), -i)
        month_start_dt = getdate(dt).replace(day=1)
        if i > 0:
            month_end_dt = add_months(today(), -i + 1).replace(day=1)
        else:
            month_end_dt = add_months(today(), 1).replace(day=1)

        months.append(formatdate(month_start_dt, "MMM YYYY"))

        sales = frappe.db.sql(
            """
            SELECT COALESCE(SUM(base_grand_total), 0) as total
            FROM `tabSales Invoice`
            WHERE docstatus = 1
            AND posting_date >= %s AND posting_date < %s
            """,
            (month_start_dt, month_end_dt),
            as_dict=True,
        )
        sales_data.append(flt(sales[0].total) if sales else 0)

        purchase = frappe.db.sql(
            """
            SELECT COALESCE(SUM(base_grand_total), 0) as total
            FROM `tabPurchase Invoice`
            WHERE docstatus = 1
            AND posting_date >= %s AND posting_date < %s
            """,
            (month_start_dt, month_end_dt),
            as_dict=True,
        )
        purchase_data.append(flt(purchase[0].total) if purchase else 0)

    return {
        "labels": months,
        "sales": sales_data,
        "purchase": purchase_data,
    }


@frappe.whitelist()
def get_company_stock_distribution():
    """Company-wise stock from Available WHs."""
    data = frappe.db.sql(
        """
        SELECT w.company, COALESCE(SUM(b.actual_qty), 0) as qty
        FROM `tabBin` b
        JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE w.name LIKE 'Available WH - %%'
        AND b.actual_qty > 0
        GROUP BY w.company
        ORDER BY qty DESC
        """,
        as_dict=True,
    )

    reserved_data = frappe.db.sql(
        """
        SELECT COALESCE(SUM(b.actual_qty), 0) as qty
        FROM `tabBin` b
        JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE w.name LIKE 'Reserved WH - %%'
        AND b.actual_qty > 0
        """,
        as_dict=True,
    )

    labels = [d.company for d in data] + ["Swastik Reserved"]
    values = [flt(d.qty) for d in data] + [flt(reserved_data[0].qty) if reserved_data else 0]

    return {"labels": labels, "values": values}


@frappe.whitelist()
def get_negative_stock():
    """All warehouses with negative stock."""
    return frappe.db.sql(
        """
        SELECT w.company, w.name as warehouse, b.item_code, b.actual_qty, b.stock_value
        FROM `tabBin` b
        JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE b.actual_qty < 0
        ORDER BY b.actual_qty ASC
        LIMIT 20
        """,
        as_dict=True,
    )


@frappe.whitelist()
def get_recent_reservations():
    """Active stock reservations."""
    return frappe.db.sql(
        """
        SELECT name, company, item, reserved_qty, reserved_for, status
        FROM `tabStock Reservation`
        WHERE docstatus = 1 AND status = 'Reserved'
        ORDER BY creation DESC
        LIMIT 10
        """,
        as_dict=True,
    )


@frappe.whitelist()
def get_recent_icts():
    """Recent intercompany transfers."""
    return frappe.db.sql(
        """
        SELECT name, company, to_company, total_qty, grand_total, posting_date, status
        FROM `tabInter Company Transfer`
        WHERE docstatus = 1
        ORDER BY posting_date DESC
        LIMIT 10
        """,
        as_dict=True,
    )
