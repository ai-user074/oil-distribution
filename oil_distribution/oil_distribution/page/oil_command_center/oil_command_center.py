import frappe
from frappe.utils import flt, today, getdate, get_first_day, add_months


def _get_filters():
    """Get company and item from form_dict."""
    company = frappe.form_dict.get("company", "All") or "All"
    item = frappe.form_dict.get("item", "All") or "All"
    return company, item


def _co_where(label="company"):
    """Return SQL fragment and args for company filter."""
    company, _ = _get_filters()
    if company and company != "All":
        return f"AND {label} = %s", [company]
    return "", []


def _item_filter(child_alias, company_col=None):
    """Return SQL JOIN + WHERE for item filter on a child table.
    child_alias: alias of child table (e.g. 'sii')
    company_col: if set, also filter by company on child (e.g. 'sii.parenttype')
    """
    _, item = _get_filters()
    if item and item != "All":
        return f"AND {child_alias}.item_code = %s", [item]
    return "", []


@frappe.whitelist()
def get_kpis():
    company, item = _get_filters()
    result = {
        "sales_mtd": 0,
        "procurement_mtd": 0,
        "available_stock": 0,
        "reserved_stock": 0,
        "negative_alerts": 0,
        "intercompany_volume": 0,
    }

    co_filter, co_args = _co_where()
    it_filter, it_args = _item_filter("sii")

    sales = frappe.db.sql(
        """SELECT COALESCE(SUM(si.base_grand_total), 0) as total
        FROM `tabSales Invoice` si
        JOIN `tabSales Invoice Item` sii ON sii.parent = si.name
        WHERE si.docstatus = 1 AND si.posting_date >= %s """
        + co_filter + it_filter,
        (get_first_day(today()),) + tuple(co_args) + tuple(it_args),
        as_dict=True,
    )
    result["sales_mtd"] = flt(sales[0].total) if sales else 0

    _, item_pi = _get_filters()
    it_filter_pi, it_args_pi = _item_filter("pii")

    purchase = frappe.db.sql(
        """SELECT COALESCE(SUM(pi.base_grand_total), 0) as total
        FROM `tabPurchase Invoice` pi
        JOIN `tabPurchase Invoice Item` pii ON pii.parent = pi.name
        WHERE pi.docstatus = 1 AND pi.posting_date >= %s """
        + co_filter + it_filter_pi,
        (get_first_day(today()),) + tuple(co_args) + tuple(it_args_pi),
        as_dict=True,
    )
    result["procurement_mtd"] = flt(purchase[0].total) if purchase else 0

    # Available stock
    it_bin_a, it_args_ba = _item_filter("b")
    if company and company != "All":
        avail = frappe.db.sql(
            """SELECT COALESCE(SUM(b.actual_qty), 0) as qty
            FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
            WHERE w.name LIKE 'Available WH - %%' AND b.actual_qty > 0 AND w.company = %s """
            + it_bin_a,
            (company,) + tuple(it_args_ba),
            as_dict=True,
        )
    else:
        avail = frappe.db.sql(
            """SELECT COALESCE(SUM(b.actual_qty), 0) as qty
            FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
            WHERE w.name LIKE 'Available WH - %%' AND b.actual_qty > 0 """
            + it_bin_a,
            tuple(it_args_ba),
            as_dict=True,
        )
    result["available_stock"] = flt(avail[0].qty) if avail else 0

    # Reserved stock
    it_bin_r, it_args_br = _item_filter("b")
    if company and company != "All":
        reserved = frappe.db.sql(
            """SELECT COALESCE(SUM(b.actual_qty), 0) as qty
            FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
            WHERE w.name LIKE 'Reserved WH - %%' AND b.actual_qty > 0 AND w.company = %s """
            + it_bin_r,
            (company,) + tuple(it_args_br),
            as_dict=True,
        )
    else:
        reserved = frappe.db.sql(
            """SELECT COALESCE(SUM(b.actual_qty), 0) as qty
            FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
            WHERE w.name LIKE 'Reserved WH - %%' AND b.actual_qty > 0 """
            + it_bin_r,
            tuple(it_args_br),
            as_dict=True,
        )
    result["reserved_stock"] = flt(reserved[0].qty) if reserved else 0

    # Negative alerts
    it_bin_n, it_args_bn = _item_filter("b")
    if company and company != "All":
        neg = frappe.db.sql(
            """SELECT COUNT(*) as cnt FROM `tabBin` b
            JOIN `tabWarehouse` w ON w.name = b.warehouse
            WHERE b.actual_qty < 0 AND w.company = %s """
            + it_bin_n,
            (company,) + tuple(it_args_bn),
            as_dict=True,
        )
    else:
        neg = frappe.db.sql(
            """SELECT COUNT(*) as cnt FROM `tabBin` b
            JOIN `tabWarehouse` w ON w.name = b.warehouse
            WHERE b.actual_qty < 0 """
            + it_bin_n,
            tuple(it_args_bn),
            as_dict=True,
        )
    result["negative_alerts"] = int(neg[0].cnt) if neg else 0

    # ICT volume
    it_ict, it_args_ict = _item_filter("iti")
    if company and company != "All":
        ict = frappe.db.sql(
            """SELECT COALESCE(SUM(it.total_qty), 0) as qty
            FROM `tabInter Company Transfer` it
            JOIN `tabInter Company Transfer Item` iti ON iti.parent = it.name
            WHERE it.docstatus = 1 AND it.posting_date >= %s
            AND (it.company = %s OR it.to_company = %s) """
            + it_ict,
            (get_first_day(today()), company, company) + tuple(it_args_ict),
            as_dict=True,
        )
    else:
        ict = frappe.db.sql(
            """SELECT COALESCE(SUM(it.total_qty), 0) as qty
            FROM `tabInter Company Transfer` it
            JOIN `tabInter Company Transfer Item` iti ON iti.parent = it.name
            WHERE it.docstatus = 1 AND it.posting_date >= %s """
            + it_ict,
            (get_first_day(today()),) + tuple(it_args_ict),
            as_dict=True,
        )
    result["intercompany_volume"] = flt(ict[0].qty) if ict else 0

    return result


@frappe.whitelist()
def get_sales_procurement_trend():
    company, item = _get_filters()
    months = []
    sales_data = []
    purchase_data = []
    co_filter, co_args = _co_where()
    it_filter_si, it_args_si = _item_filter("sii")
    it_filter_pi, it_args_pi = _item_filter("pii")

    for i in range(5, -1, -1):
        dt = add_months(today(), -i)
        month_start_dt = getdate(dt).replace(day=1)
        if i > 0:
            month_end_dt = getdate(add_months(today(), -i + 1)).replace(day=1)
        else:
            month_end_dt = getdate(add_months(today(), 1)).replace(day=1)

        months.append(month_start_dt.strftime("%b %Y"))

        sales = frappe.db.sql(
            """SELECT COALESCE(SUM(si.base_grand_total), 0) as total
            FROM `tabSales Invoice` si
            JOIN `tabSales Invoice Item` sii ON sii.parent = si.name
            WHERE si.docstatus = 1 AND si.posting_date >= %s AND si.posting_date < %s """
            + co_filter + it_filter_si,
            (month_start_dt, month_end_dt) + tuple(co_args) + tuple(it_args_si),
            as_dict=True,
        )
        sales_data.append(flt(sales[0].total) if sales else 0)

        purchase = frappe.db.sql(
            """SELECT COALESCE(SUM(pi.base_grand_total), 0) as total
            FROM `tabPurchase Invoice` pi
            JOIN `tabPurchase Invoice Item` pii ON pii.parent = pi.name
            WHERE pi.docstatus = 1 AND pi.posting_date >= %s AND pi.posting_date < %s """
            + co_filter + it_filter_pi,
            (month_start_dt, month_end_dt) + tuple(co_args) + tuple(it_args_pi),
            as_dict=True,
        )
        purchase_data.append(flt(purchase[0].total) if purchase else 0)

    return {"labels": months, "sales": sales_data, "purchase": purchase_data}


@frappe.whitelist()
def get_company_stock_distribution():
    company, item = _get_filters()
    it_filter, it_args = _item_filter("b")

    if company and company != "All":
        data = frappe.db.sql(
            """SELECT w.company, COALESCE(SUM(b.actual_qty), 0) as qty
            FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
            WHERE w.name LIKE 'Available WH - %%' AND b.actual_qty > 0 AND w.company = %s """
            + it_filter + " GROUP BY w.company ORDER BY qty DESC",
            (company,) + tuple(it_args),
            as_dict=True,
        )
    else:
        data = frappe.db.sql(
            """SELECT w.company, COALESCE(SUM(b.actual_qty), 0) as qty
            FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
            WHERE w.name LIKE 'Available WH - %%' AND b.actual_qty > 0 """
            + it_filter + " GROUP BY w.company ORDER BY qty DESC",
            tuple(it_args),
            as_dict=True,
        )

    it_filter_r, it_args_r = _item_filter("b")
    if company and company != "All":
        reserved_data = frappe.db.sql(
            """SELECT COALESCE(SUM(b.actual_qty), 0) as qty
            FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
            WHERE w.name LIKE 'Reserved WH - %%' AND b.actual_qty > 0 AND w.company = %s """
            + it_filter_r,
            (company,) + tuple(it_args_r),
            as_dict=True,
        )
    else:
        reserved_data = frappe.db.sql(
            """SELECT COALESCE(SUM(b.actual_qty), 0) as qty
            FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
            WHERE w.name LIKE 'Reserved WH - %%' AND b.actual_qty > 0 """
            + it_filter_r,
            tuple(it_args_r),
            as_dict=True,
        )

    labels = [d.company for d in data] + ["Swastik Reserved"]
    values = [flt(d.qty) for d in data] + [flt(reserved_data[0].qty) if reserved_data else 0]
    return {"labels": labels, "values": values}


@frappe.whitelist()
def get_negative_stock():
    company, item = _get_filters()
    it_filter, it_args = _item_filter("b")

    if company and company != "All":
        return frappe.db.sql(
            """SELECT w.company, w.name as warehouse, b.item_code, b.actual_qty, b.stock_value
            FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
            WHERE b.actual_qty < 0 AND w.company = %s """
            + it_filter + " ORDER BY b.actual_qty ASC LIMIT 20",
            (company,) + tuple(it_args),
            as_dict=True,
        )
    else:
        return frappe.db.sql(
            """SELECT w.company, w.name as warehouse, b.item_code, b.actual_qty, b.stock_value
            FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
            WHERE b.actual_qty < 0 """
            + it_filter + " ORDER BY b.actual_qty ASC LIMIT 20",
            tuple(it_args),
            as_dict=True,
        )


@frappe.whitelist()
def get_recent_reservations():
    company, item = _get_filters()
    it_filter, it_args = _item_filter("sr")

    if company and company != "All":
        return frappe.db.sql(
            """SELECT sr.name, sr.company, sr.item, sr.reserved_qty, sr.reserved_for, sr.status
            FROM `tabStock Reservation` sr
            WHERE sr.docstatus = 1 AND sr.status = 'Reserved' AND sr.company = %s """
            + it_filter + " ORDER BY sr.creation DESC LIMIT 10",
            (company,) + tuple(it_args),
            as_dict=True,
        )
    else:
        return frappe.db.sql(
            """SELECT sr.name, sr.company, sr.item, sr.reserved_qty, sr.reserved_for, sr.status
            FROM `tabStock Reservation` sr
            WHERE sr.docstatus = 1 AND sr.status = 'Reserved' """
            + it_filter + " ORDER BY sr.creation DESC LIMIT 10",
            tuple(it_args),
            as_dict=True,
        )


@frappe.whitelist()
def get_recent_icts():
    company, item = _get_filters()
    it_filter, it_args = _item_filter("iti")

    if company and company != "All":
        return frappe.db.sql(
            """SELECT it.name, it.company, it.to_company, it.total_qty, it.grand_total,
                   it.posting_date, it.status
            FROM `tabInter Company Transfer` it
            JOIN `tabInter Company Transfer Item` iti ON iti.parent = it.name
            WHERE it.docstatus = 1 AND (it.company = %s OR it.to_company = %s) """
            + it_filter + " GROUP BY it.name ORDER BY it.posting_date DESC LIMIT 10",
            (company, company) + tuple(it_args),
            as_dict=True,
        )
    else:
        return frappe.db.sql(
            """SELECT it.name, it.company, it.to_company, it.total_qty, it.grand_total,
                   it.posting_date, it.status
            FROM `tabInter Company Transfer` it
            JOIN `tabInter Company Transfer Item` iti ON iti.parent = it.name
            WHERE it.docstatus = 1 """
            + it_filter + " GROUP BY it.name ORDER BY it.posting_date DESC LIMIT 10",
            tuple(it_args),
            as_dict=True,
        )
