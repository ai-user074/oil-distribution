import frappe
from frappe.utils import flt, today, getdate, add_months


def _get_filters():
    """Get company and item from form_dict. Supports comma-separated multi-values."""
    company = frappe.form_dict.get("company", "All") or "All"
    item = frappe.form_dict.get("item", "All") or "All"
    return company, item


def _parse_csv(val):
    """Parse comma-separated value into a list, filtering out 'All' and empty."""
    if not val or val == "All":
        return []
    return [v.strip() for v in val.split(",") if v.strip() and v.strip() != "All"]


def _co_where(label="company"):
    """Return SQL WHERE fragment and args for company filter (supports multi)."""
    company, _ = _get_filters()
    vals = _parse_csv(company)
    if vals:
        placeholders = ", ".join(["%s"] * len(vals))
        return f"AND {label} IN ({placeholders})", vals
    return "", []


def _item_filter(alias, field="item_code"):
    """Return SQL WHERE fragment and args for item filter (supports multi).
    alias: table alias (e.g. 'sii', 'b', 'sr')
    field: column name (default 'item_code'; use 'item' for Stock Reservation)
    """
    _, item = _get_filters()
    vals = _parse_csv(item)
    if vals:
        placeholders = ", ".join(["%s"] * len(vals))
        return f"AND {alias}.{field} IN ({placeholders})", vals
    return "", []


def _ict_co_where():
    """Return WHERE fragment for ICT company filter (company OR to_company)."""
    company, _ = _get_filters()
    vals = _parse_csv(company)
    if vals:
        placeholders = ", ".join(["%s"] * len(vals))
        args = vals + vals
        return f"AND (it.company IN ({placeholders}) OR it.to_company IN ({placeholders}))", args
    return "", []


@frappe.whitelist()
def get_kpis():
    company, item = _get_filters()
    period = frappe.form_dict.get("period", "MTD") or "MTD"
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

    sales_date_cond, sales_date_args = _period_condition(period, "si")
    sales = frappe.db.sql(
        """SELECT COALESCE(SUM(si.base_grand_total), 0) as total
        FROM `tabSales Invoice` si
        JOIN `tabSales Invoice Item` sii ON sii.parent = si.name
        WHERE si.docstatus = 1 """
        + sales_date_cond + co_filter + it_filter,
        tuple(sales_date_args) + tuple(co_args) + tuple(it_args),
        as_dict=True,
    )
    result["sales_mtd"] = flt(sales[0].total) if sales else 0

    _, item_pi = _get_filters()
    it_filter_pi, it_args_pi = _item_filter("pii")

    purchase_date_cond, purchase_date_args = _period_condition(period, "pi")
    purchase = frappe.db.sql(
        """SELECT COALESCE(SUM(pi.base_grand_total), 0) as total
        FROM `tabPurchase Invoice` pi
        JOIN `tabPurchase Invoice Item` pii ON pii.parent = pi.name
        WHERE pi.docstatus = 1 """
        + purchase_date_cond + co_filter + it_filter_pi,
        tuple(purchase_date_args) + tuple(co_args) + tuple(it_args_pi),
        as_dict=True,
    )
    result["procurement_mtd"] = flt(purchase[0].total) if purchase else 0
    result["profit_loss"] = result["sales_mtd"] - result["procurement_mtd"]

    # Available stock
    it_bin_a, it_args_ba = _item_filter("b")
    w_co_a, w_co_args_a = _co_where("w.company")
    avail = frappe.db.sql(
        """SELECT COALESCE(SUM(b.actual_qty), 0) as qty
        FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE w.name LIKE 'Available WH - %%' AND b.actual_qty > 0 """
        + w_co_a + it_bin_a,
        tuple(w_co_args_a) + tuple(it_args_ba),
        as_dict=True,
    )
    result["available_stock"] = flt(avail[0].qty) if avail else 0

    # Reserved stock
    it_bin_r, it_args_br = _item_filter("b")
    w_co_r, w_co_args_r = _co_where("w.company")
    reserved = frappe.db.sql(
        """SELECT COALESCE(SUM(b.actual_qty), 0) as qty
        FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE w.name LIKE 'Reserved WH - %%' AND b.actual_qty > 0 """
        + w_co_r + it_bin_r,
        tuple(w_co_args_r) + tuple(it_args_br),
        as_dict=True,
    )
    result["reserved_stock"] = flt(reserved[0].qty) if reserved else 0

    # Negative alerts
    it_bin_n, it_args_bn = _item_filter("b")
    w_co_n, w_co_args_n = _co_where("w.company")
    neg = frappe.db.sql(
        """SELECT COUNT(*) as cnt FROM `tabBin` b
        JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE b.actual_qty < 0 """
        + w_co_n + it_bin_n,
        tuple(w_co_args_n) + tuple(it_args_bn),
        as_dict=True,
    )
    result["negative_alerts"] = int(neg[0].cnt) if neg else 0

    # ICT volume (FY-aware)
    it_ict, it_args_ict = _item_filter("iti")
    ict_co, ict_co_args = _ict_co_where()
    ict_date_cond, ict_date_args = _period_condition(period, "it")
    ict = frappe.db.sql(
        """SELECT COALESCE(SUM(it.total_qty), 0) as qty
        FROM `tabInter Company Transfer` it
        JOIN `tabInter Company Transfer Item` iti ON iti.parent = it.name
        WHERE it.docstatus = 1 """
        + ict_date_cond + ict_co + it_ict,
        tuple(ict_date_args) + tuple(ict_co_args) + tuple(it_args_ict),
        as_dict=True,
    )
    result["intercompany_volume"] = flt(ict[0].qty) if ict else 0

    # --- ICT extended KPIs (FY-aware) ---
    it_ext, it_args_ext = _item_filter("iti")
    ict_co_ext, ict_co_args_ext = _ict_co_where()
    ict_ext_date_cond, ict_ext_date_args = _period_condition(period, "it")
    ict_ext = frappe.db.sql(
        """SELECT COUNT(*) as cnt, COALESCE(SUM(it.grand_total), 0) as val
        FROM `tabInter Company Transfer` it
        JOIN `tabInter Company Transfer Item` iti ON iti.parent = it.name
        WHERE it.docstatus = 1 """
        + ict_ext_date_cond + ict_co_ext + it_ext,
        tuple(ict_ext_date_args) + tuple(ict_co_args_ext) + tuple(it_args_ext),
        as_dict=True,
    )
    result["ict_count_mtd"] = int(ict_ext[0].cnt) if ict_ext else 0
    result["ict_value_mtd"] = flt(ict_ext[0].val) if ict_ext else 0

    # Pending ICTs (no date filter - always current)
    it_pend, it_args_pend = _item_filter("iti")
    ict_co_pend, ict_co_args_pend = _ict_co_where()
    pending = frappe.db.sql(
        """SELECT COUNT(DISTINCT it.name) as cnt
        FROM `tabInter Company Transfer` it
        JOIN `tabInter Company Transfer Item` iti ON iti.parent = it.name
        WHERE it.docstatus = 1 AND it.status != 'Completed' """
        + ict_co_pend + it_pend,
        tuple(ict_co_args_pend) + tuple(it_args_pend), as_dict=True,
    )
    result["pending_icts"] = int(pending[0].cnt) if pending else 0

    # Routes breakdown (FY-aware)
    it_route, it_args_route = _item_filter("iti")
    ict_co_route, ict_co_args_route = _ict_co_where()
    route_date_cond, route_date_args = _period_condition(period, "it")
    routes = frappe.db.sql(
        "SELECT it.company, it.to_company, COUNT(*) as cnt,"
        " COALESCE(SUM(it.total_qty), 0) as qty,"
        " COALESCE(SUM(it.grand_total), 0) as value,"
        " GROUP_CONCAT(DISTINCT iti.item_code) as item_list"
        " FROM `tabInter Company Transfer` it"
        " JOIN `tabInter Company Transfer Item` iti ON iti.parent = it.name"
        " WHERE it.docstatus = 1 "
        + route_date_cond + ict_co_route + " " + it_route
        + " GROUP BY it.company, it.to_company ORDER BY cnt DESC",
        tuple(route_date_args) + tuple(ict_co_args_route) + tuple(it_args_route), as_dict=True,
    )
    result["active_routes"] = len(routes) if routes else 0
    result["routes_breakdown"] = routes or []

    # --- Reservation extended KPIs ---
    it_res, it_args_res = _item_filter("b")
    w_co_res, w_co_args_res = _co_where("w.company")
    res_ext = frappe.db.sql(
        """SELECT COALESCE(SUM(b.stock_value), 0) as value,
                COUNT(DISTINCT b.item_code) as item_count
        FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE w.name LIKE 'Reserved WH - %%' AND b.actual_qty > 0 """
        + w_co_res + it_res,
        tuple(w_co_args_res) + tuple(it_args_res), as_dict=True,
    )
    result["reserved_value"] = flt(res_ext[0].value) if res_ext else 0
    result["reserved_items"] = int(res_ext[0].item_count) if res_ext else 0

    # Utilization %
    tot_stock = result["available_stock"] + result["reserved_stock"]
    result["utilization_pct"] = round((result["reserved_stock"] / tot_stock) * 100, 1) if tot_stock > 0 else 0

    # Reserved by company
    w_co_rc, w_co_args_rc = _co_where("w.company")
    res_comp = frappe.db.sql(
        "SELECT w.company, ROUND(SUM(b.actual_qty), 0) as qty,"
        " ROUND(SUM(b.stock_value), 0) as value"
        " FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse"
        " WHERE w.name LIKE 'Reserved WH - %%' AND b.actual_qty > 0 "
        + w_co_rc + " " + it_res + " GROUP BY w.company ORDER BY value DESC",
        tuple(w_co_args_rc) + tuple(it_args_res), as_dict=True,
    )
    result["reserved_by_company"] = res_comp or []

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

    num_months = int(frappe.form_dict.get("months", 6) or 6)

    fy = frappe.form_dict.get("fy", "All") or "All"
    fy_start = fy_end = None
    if fy != "All" and "," not in fy:
        fy_parts = fy.split("_")
        if len(fy_parts) == 2:
            fy_start = getdate(fy_parts[0])
            fy_end = getdate(fy_parts[1])

    # Use FY end as reference when a single FY is selected
    ref = getdate(today())
    if fy_start:
        ref = fy_end if fy_end < ref else ref

    for i in range(num_months - 1, -1, -1):
        dt = add_months(ref, -i)
        month_start_dt = getdate(dt).replace(day=1)
        month_end_dt = getdate(add_months(month_start_dt, 1))

        if fy_start:
            if month_start_dt >= fy_end or month_end_dt <= fy_start:
                months.append("")
                sales_data.append(0)
                purchase_data.append(0)
                continue
            if month_start_dt < fy_start:
                month_start_dt = fy_start
            if month_end_dt > fy_end:
                month_end_dt = fy_end

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

    w_co, w_co_args = _co_where("w.company")
    data = frappe.db.sql(
        """SELECT w.company, COALESCE(SUM(b.actual_qty), 0) as qty
        FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE w.name LIKE 'Available WH - %%' AND b.actual_qty > 0 """
        + w_co + it_filter + " GROUP BY w.company ORDER BY qty DESC",
        tuple(w_co_args) + tuple(it_args),
        as_dict=True,
    )

    it_filter_r, it_args_r = _item_filter("b")
    w_co_r, w_co_args_r = _co_where("w.company")
    reserved_data = frappe.db.sql(
        """SELECT COALESCE(SUM(b.actual_qty), 0) as qty
        FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE w.name LIKE 'Reserved WH - %%' AND b.actual_qty > 0 """
        + w_co_r + it_filter_r,
        tuple(w_co_args_r) + tuple(it_args_r),
        as_dict=True,
    )

    labels = [d.company for d in data] + ["Swastik Reserved"]
    values = [flt(d.qty) for d in data] + [flt(reserved_data[0].qty) if reserved_data else 0]
    return {"labels": labels, "values": values}


@frappe.whitelist()
def get_negative_stock():
    company, item = _get_filters()
    it_filter, it_args = _item_filter("b")
    w_co, w_co_args = _co_where("w.company")

    return frappe.db.sql(
        """SELECT w.company, w.name as warehouse, b.item_code, b.actual_qty, b.stock_value
        FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE b.actual_qty < 0 """
        + w_co + it_filter + " ORDER BY b.actual_qty ASC LIMIT 20",
        tuple(w_co_args) + tuple(it_args),
        as_dict=True,
    )

@frappe.whitelist()
def get_recent_reservations():
    company, item = _get_filters()
    it_filter, it_args = _item_filter("sr", "item")
    sr_co, sr_co_args = _co_where("sr.company")

    return frappe.db.sql(
        """SELECT sr.name, sr.company, sr.item, sr.reserved_qty, sr.reserved_for, sr.status
        FROM `tabStock Reservation` sr
        WHERE sr.docstatus = 1 AND sr.status = 'Reserved' """
        + sr_co + it_filter + " ORDER BY sr.creation DESC LIMIT 10",
        tuple(sr_co_args) + tuple(it_args),
        as_dict=True,
    )


@frappe.whitelist()
def get_recent_icts():
    company, item = _get_filters()
    it_filter, it_args = _item_filter("iti")
    ict_co, ict_co_args = _ict_co_where()

    fy = frappe.form_dict.get("fy", "All") or "All"
    date_cond = ""
    date_args = []
    if fy != "All" and "," not in fy:
        fy_parts = fy.split("_")
        if len(fy_parts) == 2:
            fy_start = getdate(fy_parts[0])
            fy_end = getdate(fy_parts[1])
            date_cond = "AND it.posting_date >= %s AND it.posting_date < %s"
            date_args = [fy_start, fy_end]

    return frappe.db.sql(
        """SELECT it.name, it.company, it.to_company, it.total_qty, it.grand_total,
               it.posting_date, it.status
        FROM `tabInter Company Transfer` it
        JOIN `tabInter Company Transfer Item` iti ON iti.parent = it.name
        WHERE it.docstatus = 1 """
        + date_cond + ict_co + it_filter + " GROUP BY it.name ORDER BY it.posting_date DESC LIMIT 10",
        tuple(date_args) + tuple(ict_co_args) + tuple(it_args),
        as_dict=True,
    )


@frappe.whitelist()
def get_top_items():
    """Top selling items by revenue."""
    company, item = _get_filters()
    co_filter, co_args = _co_where("si.company")
    it_filter, it_args = _item_filter("sii")

    period = frappe.form_dict.get("period", "MTD") or "MTD"
    date_cond, date_args = _period_condition(period)

    return frappe.db.sql(
        """SELECT sii.item_code, sii.item_name,
            SUM(sii.amount) as total_revenue,
            SUM(sii.qty) as total_qty,
            COUNT(DISTINCT si.name) as invoice_count
        FROM `tabSales Invoice` si
        JOIN `tabSales Invoice Item` sii ON sii.parent = si.name
        WHERE si.docstatus = 1 """ + date_cond + co_filter + it_filter + """
        GROUP BY sii.item_code
        ORDER BY total_revenue DESC LIMIT 10""",
        tuple(date_args) + tuple(co_args) + tuple(it_args),
        as_dict=True,
    )


@frappe.whitelist()
def get_top_customers():
    """Top customers by purchase volume."""
    company, item = _get_filters()
    co_filter, co_args = _co_where("si.company")

    period = frappe.form_dict.get("period", "MTD") or "MTD"
    date_cond, date_args = _period_condition(period)

    return frappe.db.sql(
        """SELECT si.customer, si.customer_name,
            SUM(si.base_grand_total) as total_amount,
            COUNT(DISTINCT si.name) as invoice_count,
            SUM(si.base_grand_total) / COUNT(DISTINCT si.name) as avg_invoice
        FROM `tabSales Invoice` si
        WHERE si.docstatus = 1 """ + date_cond + co_filter + """
        GROUP BY si.customer
        ORDER BY total_amount DESC LIMIT 10""",
        tuple(date_args) + tuple(co_args),
        as_dict=True,
    )


@frappe.whitelist()
def get_warehouse_stock():
    company, item = _get_filters()
    it_filter, it_args = _item_filter("b")
    w_co, w_co_args = _co_where("w.company")

    return frappe.db.sql(
        """SELECT w.name as warehouse, w.company, COUNT(DISTINCT b.item_code) as item_count,
                ROUND(SUM(b.actual_qty), 0) as total_qty, ROUND(SUM(b.stock_value), 0) as total_value
        FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE w.name LIKE '%% WH - %%' AND b.actual_qty != 0 """
        + w_co + it_filter + " GROUP BY w.name ORDER BY total_value DESC LIMIT 20",
        tuple(w_co_args) + tuple(it_args),
        as_dict=True,
    )

@frappe.whitelist()
def get_stock_movement():
    """Recent stock ledger entries for movement chart."""
    company, item = _get_filters()
    it_filter, it_args = _item_filter("sle")

    co_filter, co_args = _co_where("sle.company")

    return frappe.db.sql(
        """SELECT DATE(sle.posting_date) as date,
            SUM(sle.actual_qty) as qty_change,
            SUM(sle.stock_value_difference) as value_change
        FROM `tabStock Ledger Entry` sle
        WHERE sle.docstatus = 1 """
        + co_filter + it_filter + """
        GROUP BY DATE(sle.posting_date)
        ORDER BY date DESC LIMIT 30""",
        tuple(co_args) + tuple(it_args),
        as_dict=True,
    )


@frappe.whitelist()
def get_ict_chain():
    company, item = _get_filters()
    it_filter, it_args = _item_filter("iti")
    ict_co, ict_co_args = _ict_co_where()

    fy = frappe.form_dict.get("fy", "All") or "All"
    date_cond = ""
    date_args = []
    if fy != "All" and "," not in fy:
        fy_parts = fy.split("_")
        if len(fy_parts) == 2:
            fy_start = getdate(fy_parts[0])
            fy_end = getdate(fy_parts[1])
            date_cond = "AND it.posting_date >= %s AND it.posting_date < %s"
            date_args = [fy_start, fy_end]

    return frappe.db.sql(
        """SELECT it.name, it.company, it.to_company, it.total_qty, it.grand_total,
                it.posting_date, it.status, iti.item_code,
                GROUP_CONCAT(DISTINCT iti.item_code) as item_list,
                COUNT(DISTINCT iti.item_code) as item_count
        FROM `tabInter Company Transfer` it
        JOIN `tabInter Company Transfer Item` iti ON iti.parent = it.name
        WHERE it.docstatus = 1 """
        + date_cond + ict_co + it_filter + " GROUP BY it.name ORDER BY it.grand_total DESC LIMIT 10",
        tuple(date_args) + tuple(ict_co_args) + tuple(it_args),
        as_dict=True,
    )


@frappe.whitelist()
def get_company_comparison():
    """Company-wise comparison for current period."""
    company, item = _get_filters()
    it_filter, it_args = _item_filter("sii")

    period = frappe.form_dict.get("period", "MTD") or "MTD"

    companies = ["Geeta Enterprise", "Global Export", "Shubham Enterprise"]
    pii_filter, pii_args = _item_filter("pii")
    result = []
    for co in companies:
        sales_date_cond, sales_date_args = _period_condition(period, "si")
        purchase_date_cond, purchase_date_args = _period_condition(period, "pi")

        sales = frappe.db.sql(
            """SELECT COALESCE(SUM(si.base_grand_total), 0) as total
            FROM `tabSales Invoice` si
            JOIN `tabSales Invoice Item` sii ON sii.parent = si.name
            WHERE si.docstatus = 1 AND si.company = %s """ + sales_date_cond + it_filter,
            (co,) + tuple(sales_date_args) + tuple(it_args),
            as_dict=True,
        )
        purchase = frappe.db.sql(
            """SELECT COALESCE(SUM(pi.base_grand_total), 0) as total
            FROM `tabPurchase Invoice` pi
            JOIN `tabPurchase Invoice Item` pii ON pii.parent = pi.name
            WHERE pi.docstatus = 1 AND pi.company = %s """ + purchase_date_cond + pii_filter,
            (co,) + tuple(purchase_date_args) + tuple(pii_args),
            as_dict=True,
        )
        stock = frappe.db.sql(
            """SELECT COALESCE(SUM(b.actual_qty), 0) as qty
            FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
            WHERE w.name LIKE 'Available WH - %%' AND b.actual_qty > 0 AND w.company = %s """
            + _item_filter("b")[0],
            (co,) + tuple(_item_filter("b")[1]),
            as_dict=True,
        )
        result.append({
            "company": co,
            "abbr": {"Geeta Enterprise": "GE", "Global Export": "GEX", "Shubham Enterprise": "SHE"}.get(co, ""),
            "sales": flt(sales[0].total) if sales else 0,
            "purchase": flt(purchase[0].total) if purchase else 0,
            "stock": flt(stock[0].qty) if stock else 0,
        })
    return result


def _period_condition(period, alias="si"):
    """Return date SQL condition and args for the given period (FY-aware)."""
    today_dt = getdate(today())
    cur_year = today_dt.year
    cur_month = today_dt.month

    # Determine FY bounds — None means no FY boundary (all data)
    fy = frappe.form_dict.get("fy", "All") or "All"
    fy_start = fy_end = None
    if fy != "All" and "," not in fy:
        fy_parts = fy.split("_")
        if len(fy_parts) == 2:
            fy_start = getdate(fy_parts[0])
            fy_end = getdate(fy_parts[1])

    # Period end
    if fy_start:
        end = today_dt if today_dt < fy_end else fy_end
    else:
        end = today_dt
    ref_month = end.month

    # Period start
    if period == "QTD":
        q_month = ((ref_month - 1) // 3) * 3 + 1
        start = end.replace(month=q_month, day=1)
    elif period == "YTD":
        if fy_start:
            start = fy_start
        else:
            start_year = cur_year if cur_month >= 4 else cur_year - 1
            start = getdate(f"{start_year}-04-01")
    else:  # MTD
        start = end.replace(day=1)

    # Clamp start to FY bounds (only when a specific FY is selected)
    if fy_start and start < fy_start:
        start = fy_start
    if start > end:
        start = end

    return f"AND {alias}.posting_date >= %s AND {alias}.posting_date <= %s", [start, end]
