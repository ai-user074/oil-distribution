import frappe
from frappe.utils import flt, today, getdate, get_first_day, add_months


def _get_company():
    """Get company from form_dict, fallback to 'All'."""
    return frappe.form_dict.get("company", "All") or "All"


@frappe.whitelist()
def get_kpis(**kwargs):
    """Return all 6 KPI values, optionally filtered by company."""
    company = kwargs.get("company") or _get_company()
    result = {
        "sales_mtd": 0,
        "procurement_mtd": 0,
        "available_stock": 0,
        "reserved_stock": 0,
        "negative_alerts": 0,
        "intercompany_volume": 0,
    }

    co_filter = ""
    co_args = []

    if company and company != "All":
        co_filter = "AND company = %s"
        co_args = [company]

    # Sales MTD
    sales = frappe.db.sql(
        """
        SELECT COALESCE(SUM(base_grand_total), 0) as total
        FROM `tabSales Invoice`
        WHERE docstatus = 1
        AND posting_date >= %s
        """ + co_filter,
        (get_first_day(today()),) + tuple(co_args),
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
        """ + co_filter,
        (get_first_day(today()),) + tuple(co_args),
        as_dict=True,
    )
    result["procurement_mtd"] = flt(purchase[0].total) if purchase else 0

    # Available Stock
    if company and company != "All":
        avail = frappe.db.sql(
            """
            SELECT COALESCE(SUM(b.actual_qty), 0) as qty
            FROM `tabBin` b
            JOIN `tabWarehouse` w ON w.name = b.warehouse
            WHERE w.name LIKE 'Available WH - %%'
            AND b.actual_qty > 0
            AND w.company = %s
            """,
            (company,),
            as_dict=True,
        )
    else:
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
    if company and company != "All":
        reserved = frappe.db.sql(
            """
            SELECT COALESCE(SUM(b.actual_qty), 0) as qty
            FROM `tabBin` b
            JOIN `tabWarehouse` w ON w.name = b.warehouse
            WHERE w.name LIKE 'Reserved WH - %%'
            AND b.actual_qty > 0
            AND w.company = %s
            """,
            (company,),
            as_dict=True,
        )
    else:
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
    if company and company != "All":
        neg = frappe.db.sql(
            """
            SELECT COUNT(*) as cnt
            FROM `tabBin` b
            JOIN `tabWarehouse` w ON w.name = b.warehouse
            WHERE b.actual_qty < 0
            AND w.company = %s
            """,
            (company,),
            as_dict=True,
        )
    else:
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
    if company and company != "All":
        ict = frappe.db.sql(
            """
            SELECT COALESCE(SUM(total_qty), 0) as qty
            FROM `tabInter Company Transfer`
            WHERE docstatus = 1
            AND posting_date >= %s
            AND (company = %s OR to_company = %s)
            """,
            (get_first_day(today()), company, company),
            as_dict=True,
        )
    else:
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
def get_sales_procurement_trend(**kwargs):
    """Sales vs Procurement last 6 months."""
    company = kwargs.get("company") or _get_company()
    months = []
    sales_data = []
    purchase_data = []

    co_filter = ""
    co_args = []
    if company and company != "All":
        co_filter = "AND company = %s"
        co_args = [company]

    for i in range(5, -1, -1):
        dt = add_months(today(), -i)
        month_start_dt = getdate(dt).replace(day=1)
        if i > 0:
            month_end_dt = getdate(add_months(today(), -i + 1)).replace(day=1)
        else:
            month_end_dt = getdate(add_months(today(), 1)).replace(day=1)

        months.append(month_start_dt.strftime("%b %Y"))

        sales = frappe.db.sql(
            """
            SELECT COALESCE(SUM(base_grand_total), 0) as total
            FROM `tabSales Invoice`
            WHERE docstatus = 1
            AND posting_date >= %s AND posting_date < %s
            """ + co_filter,
            (month_start_dt, month_end_dt) + tuple(co_args),
            as_dict=True,
        )
        sales_data.append(flt(sales[0].total) if sales else 0)

        purchase = frappe.db.sql(
            """
            SELECT COALESCE(SUM(base_grand_total), 0) as total
            FROM `tabPurchase Invoice`
            WHERE docstatus = 1
            AND posting_date >= %s AND posting_date < %s
            """ + co_filter,
            (month_start_dt, month_end_dt) + tuple(co_args),
            as_dict=True,
        )
        purchase_data.append(flt(purchase[0].total) if purchase else 0)

    return {
        "labels": months,
        "sales": sales_data,
        "purchase": purchase_data,
    }


@frappe.whitelist()
def get_company_stock_distribution(**kwargs):
    """Company-wise stock from Available WHs."""
    company = kwargs.get("company") or _get_company()
    if company and company != "All":
        data = frappe.db.sql(
            """
            SELECT w.company, COALESCE(SUM(b.actual_qty), 0) as qty
            FROM `tabBin` b
            JOIN `tabWarehouse` w ON w.name = b.warehouse
            WHERE w.name LIKE 'Available WH - %%'
            AND b.actual_qty > 0
            AND w.company = %s
            GROUP BY w.company
            ORDER BY qty DESC
            """,
            (company,),
            as_dict=True,
        )
    else:
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

    if company and company != "All":
        reserved_data = frappe.db.sql(
            """
            SELECT COALESCE(SUM(b.actual_qty), 0) as qty
            FROM `tabBin` b
            JOIN `tabWarehouse` w ON w.name = b.warehouse
            WHERE w.name LIKE 'Reserved WH - %%'
            AND b.actual_qty > 0
            AND w.company = %s
            """,
            (company,),
            as_dict=True,
        )
    else:
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
def get_negative_stock(**kwargs):
    """All warehouses with negative stock."""
    company = kwargs.get("company") or _get_company()
    if company and company != "All":
        return frappe.db.sql(
            """
            SELECT w.company, w.name as warehouse, b.item_code, b.actual_qty, b.stock_value
            FROM `tabBin` b
            JOIN `tabWarehouse` w ON w.name = b.warehouse
            WHERE b.actual_qty < 0
            AND w.company = %s
            ORDER BY b.actual_qty ASC
            LIMIT 20
            """,
            (company,),
            as_dict=True,
        )
    else:
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
def get_recent_reservations(**kwargs):
    """Active stock reservations."""
    company = kwargs.get("company") or _get_company()
    if company and company != "All":
        return frappe.db.sql(
            """
            SELECT name, company, item, reserved_qty, reserved_for, status
            FROM `tabStock Reservation`
            WHERE docstatus = 1 AND status = 'Reserved'
            AND company = %s
            ORDER BY creation DESC
            LIMIT 10
            """,
            (company,),
            as_dict=True,
        )
    else:
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
def get_recent_icts(**kwargs):
    """Recent intercompany transfers."""
    company = kwargs.get("company") or _get_company()
    if company and company != "All":
        return frappe.db.sql(
            """
            SELECT name, company, to_company, total_qty, grand_total, posting_date, status
            FROM `tabInter Company Transfer`
            WHERE docstatus = 1
            AND (company = %s OR to_company = %s)
            ORDER BY posting_date DESC
            LIMIT 10
            """,
            (company, company),
            as_dict=True,
        )
    else:
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
