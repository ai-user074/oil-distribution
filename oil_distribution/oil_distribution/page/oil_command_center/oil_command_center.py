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
        "sales_by_company": [],
        "procurement_by_company": [],
        "profit_loss_by_company": [],
        "sales_prev": None,
        "procurement_prev": None,
        "profit_loss_prev": None,
        "sales_prev_by_company": [],
        "procurement_prev_by_company": [],
        "profit_loss_prev_by_company": [],
        "show_change": False,
    }

    # Determine if change % should be shown (only when exactly 1 period selected)
    sel_months = frappe.form_dict.get("selected_months", "")
    sel_qtrs = frappe.form_dict.get("selected_qtrs", "")
    sel_ytd_fys = frappe.form_dict.get("selected_ytd_fys", "")
    show_change = False
    if period == "MTD" and sel_months:
        month_list = [m.strip() for m in sel_months.split(",") if m.strip()]
        show_change = len(month_list) == 1
    elif period == "QTD" and sel_qtrs:
        qtr_list = [q.strip() for q in sel_qtrs.split(",") if q.strip()]
        show_change = len(qtr_list) == 1
    elif period == "YTD" and sel_ytd_fys:
        fy_list = [f.strip() for f in sel_ytd_fys.split(",") if f.strip()]
        show_change = len(fy_list) == 1
    result["show_change"] = show_change

    co_filter, co_args = _co_where()
    it_filter, it_args = _item_filter("sii")

    # Sales total + by company
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

    # Sales by company (fixed order: GE, GEX, SHE)
    sales_by_co = frappe.db.sql(
        """SELECT si.company, COALESCE(SUM(si.base_grand_total), 0) as total
        FROM `tabSales Invoice` si
        JOIN `tabSales Invoice Item` sii ON sii.parent = si.name
        WHERE si.docstatus = 1 """
        + sales_date_cond + co_filter + it_filter + """
        GROUP BY si.company""",
        tuple(sales_date_args) + tuple(co_args) + tuple(it_args),
        as_dict=True,
    )
    co_order = ["Geeta Enterprise", "Global Export", "Shubham Enterprise"]
    co_abbr = {"Geeta Enterprise": "GE", "Global Export": "GEX", "Shubham Enterprise": "SHE"}
    sales_co_map = {d.company: flt(d.total) for d in (sales_by_co or [])}
    result["sales_by_company"] = [
        {"company": co, "total": sales_co_map.get(co, 0), "abbr": co_abbr[co]}
        for co in co_order
    ]

    # Procurement total + by company
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

    # Procurement by company (fixed order: GE, GEX, SHE)
    purchase_by_co = frappe.db.sql(
        """SELECT pi.company, COALESCE(SUM(pi.base_grand_total), 0) as total
        FROM `tabPurchase Invoice` pi
        JOIN `tabPurchase Invoice Item` pii ON pii.parent = pi.name
        WHERE pi.docstatus = 1 """
        + purchase_date_cond + co_filter + it_filter_pi + """
        GROUP BY pi.company""",
        tuple(purchase_date_args) + tuple(co_args) + tuple(it_args_pi),
        as_dict=True,
    )
    purchase_co_map = {d.company: flt(d.total) for d in (purchase_by_co or [])}
    result["procurement_by_company"] = [
        {"company": co, "total": purchase_co_map.get(co, 0), "abbr": co_abbr[co]}
        for co in co_order
    ]

    result["profit_loss"] = result["sales_mtd"] - result["procurement_mtd"]

    # Previous period values for change calculation
    prev_date_cond, prev_date_args = _prev_period_condition(period, "si")
    if prev_date_cond:
        prev_sales = frappe.db.sql(
            """SELECT COALESCE(SUM(si.base_grand_total), 0) as total
            FROM `tabSales Invoice` si
            JOIN `tabSales Invoice Item` sii ON sii.parent = si.name
            WHERE si.docstatus = 1 """
            + prev_date_cond + co_filter + it_filter,
            tuple(prev_date_args) + tuple(co_args) + tuple(it_args),
            as_dict=True,
        )
        result["sales_prev"] = flt(prev_sales[0].total) if prev_sales else 0

        # Sales previous by company
        prev_sales_by_co = frappe.db.sql(
            """SELECT si.company, COALESCE(SUM(si.base_grand_total), 0) as total
            FROM `tabSales Invoice` si
            JOIN `tabSales Invoice Item` sii ON sii.parent = si.name
            WHERE si.docstatus = 1 """
            + prev_date_cond + co_filter + it_filter + """
            GROUP BY si.company""",
            tuple(prev_date_args) + tuple(co_args) + tuple(it_args),
            as_dict=True,
        )
        prev_sales_co_map = {d.company: flt(d.total) for d in (prev_sales_by_co or [])}
        result["sales_prev_by_company"] = [
            {"company": co, "abbr": co_abbr[co], "total": prev_sales_co_map.get(co, 0)}
            for co in co_order
        ]

        prev_pi_date_cond, prev_pi_date_args = _prev_period_condition(period, "pi")
        prev_purchase = frappe.db.sql(
            """SELECT COALESCE(SUM(pi.base_grand_total), 0) as total
            FROM `tabPurchase Invoice` pi
            JOIN `tabPurchase Invoice Item` pii ON pii.parent = pi.name
            WHERE pi.docstatus = 1 """
            + prev_pi_date_cond + co_filter + it_filter_pi,
            tuple(prev_pi_date_args) + tuple(co_args) + tuple(it_args_pi),
            as_dict=True,
        )
        result["procurement_prev"] = flt(prev_purchase[0].total) if prev_purchase else 0

        # Procurement previous by company
        prev_purchase_by_co = frappe.db.sql(
            """SELECT pi.company, COALESCE(SUM(pi.base_grand_total), 0) as total
            FROM `tabPurchase Invoice` pi
            JOIN `tabPurchase Invoice Item` pii ON pii.parent = pi.name
            WHERE pi.docstatus = 1 """
            + prev_pi_date_cond + co_filter + it_filter_pi + """
            GROUP BY pi.company""",
            tuple(prev_pi_date_args) + tuple(co_args) + tuple(it_args_pi),
            as_dict=True,
        )
        prev_purchase_co_map = {d.company: flt(d.total) for d in (prev_purchase_by_co or [])}
        result["procurement_prev_by_company"] = [
            {"company": co, "abbr": co_abbr[co], "total": prev_purchase_co_map.get(co, 0)}
            for co in co_order
        ]

        result["profit_loss_prev"] = result["sales_prev"] - result["procurement_prev"]

        # Profit/Loss previous by company
        result["profit_loss_prev_by_company"] = [
            {"company": co, "abbr": co_abbr[co],
             "total": result["sales_prev_by_company"][i]["total"] - result["procurement_prev_by_company"][i]["total"]}
            for i, co in enumerate(co_order)
        ]
    else:
        result["sales_prev_by_company"] = []
        result["procurement_prev_by_company"] = []
        result["profit_loss_prev_by_company"] = []

    # Profit/Loss by company (fixed order: GE, GEX, SHE)
    result["profit_loss_by_company"] = [
        {"company": co, "abbr": co_abbr[co],
         "total": result["sales_by_company"][i]["total"] - result["procurement_by_company"][i]["total"]}
        for i, co in enumerate(co_order)
    ]

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

    # ICT volume (FY-level — uses FY bounds, not period filter)
    it_ict, it_args_ict = _item_filter("iti")
    ict_co, ict_co_args = _ict_co_where()
    ict_fy_cond, ict_fy_args = _fy_only_condition("it")
    ict = frappe.db.sql(
        """SELECT COALESCE(SUM(it.total_qty), 0) as qty
        FROM `tabInter Company Transfer` it
        JOIN `tabInter Company Transfer Item` iti ON iti.parent = it.name
        WHERE it.docstatus = 1 """
        + ict_fy_cond + ict_co + it_ict,
        tuple(ict_fy_args) + tuple(ict_co_args) + tuple(it_args_ict),
        as_dict=True,
    )
    result["intercompany_volume"] = flt(ict[0].qty) if ict else 0

    # --- ICT extended KPIs (FY-level) ---
    it_ext, it_args_ext = _item_filter("iti")
    ict_co_ext, ict_co_args_ext = _ict_co_where()
    ict_fy_cond_ext, ict_fy_args_ext = _fy_only_condition("it")
    ict_ext = frappe.db.sql(
        """SELECT COUNT(*) as cnt, COALESCE(SUM(it.grand_total), 0) as val
        FROM `tabInter Company Transfer` it
        JOIN `tabInter Company Transfer Item` iti ON iti.parent = it.name
        WHERE it.docstatus = 1 """
        + ict_fy_cond_ext + ict_co_ext + it_ext,
        tuple(ict_fy_args_ext) + tuple(ict_co_args_ext) + tuple(it_args_ext),
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

    # Routes breakdown (FY-aware — all routes for the selected FY, not just current period)
    it_route, it_args_route = _item_filter("iti")
    ict_co_route, ict_co_args_route = _ict_co_where()
    route_fy_cond, route_fy_args = _fy_only_condition("it")
    routes = frappe.db.sql(
        "SELECT it.company, it.to_company, COUNT(*) as cnt,"
        " COALESCE(SUM(it.total_qty), 0) as qty,"
        " COALESCE(SUM(it.grand_total), 0) as value,"
        " GROUP_CONCAT(DISTINCT iti.item_code) as item_list"
        " FROM `tabInter Company Transfer` it"
        " JOIN `tabInter Company Transfer Item` iti ON iti.parent = it.name"
        " WHERE it.docstatus = 1 "
        + route_fy_cond + ict_co_route + " " + it_route
        + " GROUP BY it.company, it.to_company ORDER BY cnt DESC",
        tuple(route_fy_args) + tuple(ict_co_args_route) + tuple(it_args_route), as_dict=True,
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
    variance_data = []
    co_filter, co_args = _co_where()
    it_filter_si, it_args_si = _item_filter("sii")
    it_filter_pi, it_args_pi = _item_filter("pii")

    fy = frappe.form_dict.get("fy", "All") or "All"
    period = frappe.form_dict.get("period", "MTD") or "MTD"
    selected_months = frappe.form_dict.get("selected_months", "")
    selected_qtrs = frappe.form_dict.get("selected_qtrs", "")
    selected_ytd_fys = frappe.form_dict.get("selected_ytd_fys", "")

    # Parse selected months/quarters/FYs
    sel_months = []
    if selected_months:
        sel_months = [int(m) for m in selected_months.split(",") if m.strip()]

    sel_qtrs = []
    if selected_qtrs:
        sel_qtrs = [int(q) for q in selected_qtrs.split(",") if q.strip()]

    sel_ytd_fys = []
    if selected_ytd_fys:
        sel_ytd_fys = [f.strip() for f in selected_ytd_fys.split(",") if f.strip()]

    # Determine FY bounds
    fy_start = fy_end = None
    if fy != "All" and "," not in fy:
        fy_parts = fy.split("_")
        if len(fy_parts) == 2:
            fy_start = getdate(fy_parts[0])
            fy_end = getdate(fy_parts[1])

    # FY month index → (actual_month, year_offset_from_fy_start)
    FY_MONTH_MAP = {
        0: (4, 0), 1: (5, 0), 2: (6, 0), 3: (7, 0), 4: (8, 0), 5: (9, 0),
        6: (10, 1), 7: (11, 1), 8: (12, 1), 9: (1, 1), 10: (2, 1), 11: (3, 1),
    }

    # Build list of months to query
    months_to_query = []

    if period == "MTD" and sel_months:
        # Specific months selected
        if fy_start and fy_end:
            fy_months = []
            for m_idx in range(12):
                actual_month, year_offset = FY_MONTH_MAP[m_idx]
                yr = fy_start.year + year_offset
                month_start = getdate(f"{yr}-{actual_month:02d}-01")
                month_end = getdate(add_months(month_start, 1))
                # Clamp to FY bounds
                if month_start < fy_start:
                    month_start = fy_start
                if month_end > fy_end:
                    month_end = fy_end
                if month_start < month_end:
                    fy_months.append({
                        "idx": m_idx,
                        "start": month_start,
                        "end": month_end,
                        "label": month_start.strftime("%b %Y")
                    })
            for m in fy_months:
                if m["idx"] in sel_months:
                    months_to_query.append(m)
        else:
            # No FY selected, use current date as reference
            ref = getdate(today())
            for m_idx in sel_months:
                actual_month, year_offset = FY_MONTH_MAP[m_idx]
                yr = ref.year + year_offset
                month_start = getdate(f"{yr}-{actual_month:02d}-01")
                month_end = getdate(add_months(month_start, 1))
                if month_start < month_end:
                    months_to_query.append({
                        "idx": m_idx,
                        "start": month_start,
                        "end": month_end,
                        "label": month_start.strftime("%b %Y")
                    })

    elif period == "QTD" and sel_qtrs:
        # Quarters selected
        qtr_months = {1: [0, 1, 2], 2: [3, 4, 5], 3: [6, 7, 8], 4: [9, 10, 11]}
        for q in sel_qtrs:
            for m_idx in qtr_months.get(q, []):
                if fy_start and fy_end:
                    actual_month, year_offset = FY_MONTH_MAP[m_idx]
                    yr = fy_start.year + year_offset
                    month_start = getdate(f"{yr}-{actual_month:02d}-01")
                    month_end = getdate(add_months(month_start, 1))
                    if month_start < fy_start:
                        month_start = fy_start
                    if month_end > fy_end:
                        month_end = fy_end
                    if month_start < month_end:
                        months_to_query.append({
                            "idx": m_idx,
                            "start": month_start,
                            "end": month_end,
                            "label": month_start.strftime("%b %Y")
                        })
                else:
                    ref = getdate(today())
                    actual_month, year_offset = FY_MONTH_MAP[m_idx]
                    yr = ref.year + year_offset
                    month_start = getdate(f"{yr}-{actual_month:02d}-01")
                    month_end = getdate(add_months(month_start, 1))
                    if month_start < month_end:
                        months_to_query.append({
                            "idx": m_idx,
                            "start": month_start,
                            "end": month_end,
                            "label": month_start.strftime("%b %Y")
                        })

    elif period == "YTD" and sel_ytd_fys:
        # Multiple FYs selected - query all months in each FY
        # Use offset idx so months sort sequentially across FYs
        for fy_offset, fy_val in enumerate(sel_ytd_fys):
            fy_parts = fy_val.split("_")
            if len(fy_parts) == 2:
                ytd_start = getdate(fy_parts[0])
                ytd_end = getdate(fy_parts[1])
                for m_idx in range(12):
                    actual_month, year_offset = FY_MONTH_MAP[m_idx]
                    yr = ytd_start.year + year_offset
                    month_start = getdate(f"{yr}-{actual_month:02d}-01")
                    month_end = getdate(add_months(month_start, 1))
                    if month_start < ytd_start:
                        month_start = ytd_start
                    if month_end > ytd_end:
                        month_end = ytd_end
                    if month_start < month_end:
                        months_to_query.append({
                            "idx": fy_offset * 12 + m_idx,
                            "start": month_start,
                            "end": month_end,
                            "label": month_start.strftime("%b %Y")
                        })
    else:
        # Default: query recent N months
        num_months = 6
        ref = getdate(today())
        if fy_start:
            ref = fy_end if fy_end < ref else ref
        for i in range(num_months - 1, -1, -1):
            dt = add_months(ref, -i)
            month_start_dt = getdate(dt).replace(day=1)
            month_end_dt = getdate(add_months(month_start_dt, 1))
            if fy_start:
                if month_start_dt >= fy_end or month_end_dt <= fy_start:
                    continue
                if month_start_dt < fy_start:
                    month_start_dt = fy_start
                if month_end_dt > fy_end:
                    month_end_dt = fy_end
            months_to_query.append({
                "idx": i,
                "start": month_start_dt,
                "end": month_end_dt,
                "label": month_start_dt.strftime("%b %Y")
            })

    # Sort by actual start date to ensure calendar/FY order regardless of selection order
    months_to_query.sort(key=lambda x: x["start"])

    # Query data for each month
    for m in months_to_query:
        months.append(m["label"])

        sales = frappe.db.sql(
            """SELECT COALESCE(SUM(si.base_grand_total), 0) as total
            FROM `tabSales Invoice` si
            JOIN `tabSales Invoice Item` sii ON sii.parent = si.name
            WHERE si.docstatus = 1 AND si.posting_date >= %s AND si.posting_date < %s """
            + co_filter + it_filter_si,
            (m["start"], m["end"]) + tuple(co_args) + tuple(it_args_si),
            as_dict=True,
        )
        sales_val = flt(sales[0].total) if sales else 0
        sales_data.append(sales_val)

        purchase = frappe.db.sql(
            """SELECT COALESCE(SUM(pi.base_grand_total), 0) as total
            FROM `tabPurchase Invoice` pi
            JOIN `tabPurchase Invoice Item` pii ON pii.parent = pi.name
            WHERE pi.docstatus = 1 AND pi.posting_date >= %s AND pi.posting_date < %s """
            + co_filter + it_filter_pi,
            (m["start"], m["end"]) + tuple(co_args) + tuple(it_args_pi),
            as_dict=True,
        )
        purchase_val = flt(purchase[0].total) if purchase else 0
        purchase_data.append(purchase_val)

        # Variance = Sales - Procurement
        variance_data.append(sales_val - purchase_val)

    # Calculate variance change (MoM/QoQ/YoY) - capped at 999%
    variance_change = []
    for i in range(len(variance_data)):
        if i == 0 or variance_data[i - 1] == 0:
            variance_change.append(None)  # N/A for first period
        else:
            change = ((variance_data[i] - variance_data[i - 1]) / abs(variance_data[i - 1])) * 100
            change = max(-999, min(999, change))  # Cap at ±999%
            variance_change.append(round(change, 1))

    return {
        "labels": months,
        "sales": sales_data,
        "purchase": purchase_data,
        "variance": variance_data,
        "variance_change": variance_change
    }


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

    fy_cond, fy_args = _fy_only_condition("it")

    return frappe.db.sql(
        """SELECT it.name, it.company, it.to_company, it.total_qty, it.grand_total,
               it.posting_date, it.status
        FROM `tabInter Company Transfer` it
        JOIN `tabInter Company Transfer Item` iti ON iti.parent = it.name
        WHERE it.docstatus = 1 """
        + fy_cond + ict_co + it_filter + " GROUP BY it.name ORDER BY it.posting_date DESC LIMIT 10",
        tuple(fy_args) + tuple(ict_co_args) + tuple(it_args),
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

    fy_cond, fy_args = _fy_only_condition("it")

    return frappe.db.sql(
        """SELECT it.name, it.company, it.to_company, it.total_qty, it.grand_total,
                it.posting_date, it.status, iti.item_code,
                GROUP_CONCAT(DISTINCT iti.item_code) as item_list,
                COUNT(DISTINCT iti.item_code) as item_count
        FROM `tabInter Company Transfer` it
        JOIN `tabInter Company Transfer Item` iti ON iti.parent = it.name
        WHERE it.docstatus = 1 """
        + fy_cond + ict_co + it_filter + " GROUP BY it.name ORDER BY it.grand_total DESC LIMIT 10",
        tuple(fy_args) + tuple(ict_co_args) + tuple(it_args),
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
    """Return date SQL condition and args for the given period (FY-aware, respects month/quarter selections)."""
    today_dt = getdate(today())

    # FY month index → (actual_month, year_offset_from_fy_start)
    # m_idx 0=Apr, 1=May, ..., 11=Mar
    FY_MONTH_MAP = {
        0: (4, 0), 1: (5, 0), 2: (6, 0), 3: (7, 0), 4: (8, 0), 5: (9, 0),
        6: (10, 1), 7: (11, 1), 8: (12, 1), 9: (1, 1), 10: (2, 1), 11: (3, 1),
    }

    # Determine FY bounds
    fy = frappe.form_dict.get("fy", "All") or "All"
    fy_start = fy_end = None
    if fy != "All" and "," not in fy:
        fy_parts = fy.split("_")
        if len(fy_parts) == 2:
            fy_start = getdate(fy_parts[0])
            fy_end = getdate(fy_parts[1])

    selected_months = frappe.form_dict.get("selected_months", "")
    selected_qtrs = frappe.form_dict.get("selected_qtrs", "")
    selected_ytd_fys = frappe.form_dict.get("selected_ytd_fys", "")

    # Build list of (month_start, month_end) ranges
    ranges = []

    if period == "MTD" and selected_months:
        sel = [int(m) for m in selected_months.split(",") if m.strip()]
        if fy_start and fy_end:
            for m_idx in sel:
                actual_month, year_offset = FY_MONTH_MAP[m_idx]
                yr = fy_start.year + year_offset
                ms = getdate(f"{yr}-{actual_month:02d}-01")
                me = getdate(add_months(ms, 1))
                if ms < fy_start: ms = fy_start
                if me > fy_end: me = fy_end
                if ms < me:
                    ranges.append((ms, me))
        else:
            ref = fy_end if fy_end and fy_end < today_dt else today_dt
            for m_idx in sel:
                actual_month, year_offset = FY_MONTH_MAP[m_idx]
                yr = ref.year + year_offset
                ms = getdate(f"{yr}-{actual_month:02d}-01")
                me = getdate(add_months(ms, 1))
                if ms < me:
                    ranges.append((ms, me))

    elif period == "QTD" and selected_qtrs:
        sel_q = [int(q) for q in selected_qtrs.split(",") if q.strip()]
        qtr_months = {1: [0, 1, 2], 2: [3, 4, 5], 3: [6, 7, 8], 4: [9, 10, 11]}
        if fy_start and fy_end:
            for q in sel_q:
                for m_idx in qtr_months.get(q, []):
                    actual_month, year_offset = FY_MONTH_MAP[m_idx]
                    yr = fy_start.year + year_offset
                    ms = getdate(f"{yr}-{actual_month:02d}-01")
                    me = getdate(add_months(ms, 1))
                    if ms < fy_start: ms = fy_start
                    if me > fy_end: me = fy_end
                    if ms < me:
                        ranges.append((ms, me))
        else:
            ref = today_dt
            for q in sel_q:
                for m_idx in qtr_months.get(q, []):
                    actual_month, year_offset = FY_MONTH_MAP[m_idx]
                    yr = ref.year + year_offset
                    ms = getdate(f"{yr}-{actual_month:02d}-01")
                    me = getdate(add_months(ms, 1))
                    if ms < me:
                        ranges.append((ms, me))

    elif period == "YTD" and selected_ytd_fys:
        for fy_val in selected_ytd_fys.split(","):
            fy_val = fy_val.strip()
            fy_parts = fy_val.split("_")
            if len(fy_parts) == 2:
                ytd_start = getdate(fy_parts[0])
                ytd_end = getdate(fy_parts[1])
                for m_idx in range(12):
                    actual_month, year_offset = FY_MONTH_MAP[m_idx]
                    yr = ytd_start.year + year_offset
                    ms = getdate(f"{yr}-{actual_month:02d}-01")
                    me = getdate(add_months(ms, 1))
                    if ms < ytd_start: ms = ytd_start
                    if me > ytd_end: me = ytd_end
                    if ms < me:
                        ranges.append((ms, me))

    else:
        # Fallback: generic MTD/QTD/YTD
        if fy_start:
            end = today_dt if today_dt < fy_end else fy_end
        else:
            end = today_dt
        ref_month = end.month
        if period == "QTD":
            q_month = ((ref_month - 1) // 3) * 3 + 1
            start = end.replace(month=q_month, day=1)
        elif period == "YTD":
            if fy_start:
                start = fy_start
            else:
                start_year = today_dt.year if today_dt.month >= 4 else today_dt.year - 1
                start = getdate(f"{start_year}-04-01")
        else:
            start = end.replace(day=1)
        if fy_start and start < fy_start:
            start = fy_start
        if start > end:
            start = end
        ranges.append((start, end))

    if not ranges:
        return "", []

    # Build OR conditions for multiple ranges
    conditions = []
    args = []
    for ms, me in ranges:
        conditions.append(f"{alias}.posting_date >= %s AND {alias}.posting_date < %s")
        args.extend([ms, me])

    return "AND (" + " OR ".join(conditions) + ")", args


def _fy_only_condition(alias="si"):
    """Return FY-only date SQL condition (no period filter)."""
    fy = frappe.form_dict.get("fy", "All") or "All"
    if fy == "All" or "," in fy:
        return "", []
    fy_parts = fy.split("_")
    if len(fy_parts) != 2:
        return "", []
    fy_start = getdate(fy_parts[0])
    fy_end = getdate(fy_parts[1])
    return f"AND {alias}.posting_date >= %s AND {alias}.posting_date < %s", [fy_start, fy_end]


def _prev_period_condition(period, alias="si"):
    """Return date SQL condition and args for the comparison period.
    
    Supports:
    - compare_month: Specific month index (0=Apr, 1=May, ..., 11=Mar) to compare against
    - compare_qtr: Specific quarter (1-4) to compare against
    - compare_fy: Specific FY value (e.g., "2024-04-01_2025-03-31") to compare against
    - Default: Previous period (shift back by 1)
    """
    today_dt = getdate(today())
    
    # Get comparison selections from form
    compare_month = frappe.form_dict.get("compare_month", "")
    compare_qtr = frappe.form_dict.get("compare_qtr", "")
    compare_fy = frappe.form_dict.get("compare_fy", "")

    # FY month index → (actual_month, year_offset_from_fy_start)
    FY_MONTH_MAP = {
        0: (4, 0), 1: (5, 0), 2: (6, 0), 3: (7, 0), 4: (8, 0), 5: (9, 0),
        6: (10, 1), 7: (11, 1), 8: (12, 1), 9: (1, 1), 10: (2, 1), 11: (3, 1),
    }

    # Determine FY bounds
    fy = frappe.form_dict.get("fy", "All") or "All"
    fy_start = fy_end = None
    if fy != "All" and "," not in fy:
        fy_parts = fy.split("_")
        if len(fy_parts) == 2:
            fy_start = getdate(fy_parts[0])
            fy_end = getdate(fy_parts[1])

    selected_months = frappe.form_dict.get("selected_months", "")
    selected_qtrs = frappe.form_dict.get("selected_qtrs", "")
    selected_ytd_fys = frappe.form_dict.get("selected_ytd_fys", "")

    ranges = []

    if period == "MTD" and selected_months:
        sel = [int(m) for m in selected_months.split(",") if m.strip()]
        if compare_month != "":
            # User selected a specific month to compare against
            cmp_m = int(compare_month)
            actual_month, year_offset = FY_MONTH_MAP[cmp_m]
            if fy_start and fy_end:
                yr = fy_start.year + year_offset
                ms = getdate(f"{yr}-{actual_month:02d}-01")
                me = getdate(add_months(ms, 1))
                if ms < fy_start: ms = fy_start
                if me > fy_end: me = fy_end
                if ms < me:
                    ranges.append((ms, me))
            else:
                ref = fy_end if fy_end and fy_end < today_dt else today_dt
                yr = ref.year + year_offset
                ms = getdate(f"{yr}-{actual_month:02d}-01")
                me = getdate(add_months(ms, 1))
                if ms < me:
                    ranges.append((ms, me))
        else:
            # Default: shift back 1 month
            if fy_start and fy_end:
                for m_idx in sel:
                    prev_m_idx = m_idx - 1
                    if prev_m_idx < 0:
                        prev_m_idx = 11
                    actual_month, year_offset = FY_MONTH_MAP[prev_m_idx]
                    yr = fy_start.year + year_offset
                    ms = getdate(f"{yr}-{actual_month:02d}-01")
                    me = getdate(add_months(ms, 1))
                    if ms < fy_start: ms = fy_start
                    if me > fy_end: me = fy_end
                    if ms < me:
                        ranges.append((ms, me))
            else:
                ref = fy_end if fy_end and fy_end < today_dt else today_dt
                for m_idx in sel:
                    prev_m_idx = m_idx - 1
                    if prev_m_idx < 0:
                        prev_m_idx = 11
                    actual_month, year_offset = FY_MONTH_MAP[prev_m_idx]
                    yr = ref.year + year_offset
                    ms = getdate(f"{yr}-{actual_month:02d}-01")
                    me = getdate(add_months(ms, 1))
                    if ms < me:
                        ranges.append((ms, me))

    elif period == "QTD" and selected_qtrs:
        sel_q = [int(q) for q in selected_qtrs.split(",") if q.strip()]
        qtr_months = {1: [0, 1, 2], 2: [3, 4, 5], 3: [6, 7, 8], 4: [9, 10, 11]}
        if compare_qtr != "":
            # User selected a specific quarter to compare against
            cmp_q = int(compare_qtr)
            for m_idx in qtr_months.get(cmp_q, []):
                actual_month, year_offset = FY_MONTH_MAP[m_idx]
                if fy_start and fy_end:
                    yr = fy_start.year + year_offset
                    ms = getdate(f"{yr}-{actual_month:02d}-01")
                    me = getdate(add_months(ms, 1))
                    if ms < fy_start: ms = fy_start
                    if me > fy_end: me = fy_end
                    if ms < me:
                        ranges.append((ms, me))
                else:
                    ref = today_dt
                    yr = ref.year + year_offset
                    ms = getdate(f"{yr}-{actual_month:02d}-01")
                    me = getdate(add_months(ms, 1))
                    if ms < me:
                        ranges.append((ms, me))
        else:
            # Default: shift back 1 quarter
            if fy_start and fy_end:
                for q in sel_q:
                    prev_q = q - 1 if q > 1 else 4
                    for m_idx in qtr_months.get(prev_q, []):
                        actual_month, year_offset = FY_MONTH_MAP[m_idx]
                        yr = fy_start.year + year_offset
                        ms = getdate(f"{yr}-{actual_month:02d}-01")
                        me = getdate(add_months(ms, 1))
                        if ms < fy_start: ms = fy_start
                        if me > fy_end: me = fy_end
                        if ms < me:
                            ranges.append((ms, me))
            else:
                ref = today_dt
                for q in sel_q:
                    prev_q = q - 1 if q > 1 else 4
                    for m_idx in qtr_months.get(prev_q, []):
                        actual_month, year_offset = FY_MONTH_MAP[m_idx]
                        yr = ref.year + year_offset
                        ms = getdate(f"{yr}-{actual_month:02d}-01")
                        me = getdate(add_months(ms, 1))
                        if ms < me:
                            ranges.append((ms, me))

    elif period == "YTD" and selected_ytd_fys:
        if compare_fy != "":
            # User selected a specific FY to compare against
            cmp_fy_parts = compare_fy.split("_")
            if len(cmp_fy_parts) == 2:
                cmp_start = getdate(cmp_fy_parts[0])
                cmp_end = getdate(cmp_fy_parts[1])
                for m_idx in range(12):
                    actual_month, year_offset = FY_MONTH_MAP[m_idx]
                    yr = cmp_start.year + year_offset
                    ms = getdate(f"{yr}-{actual_month:02d}-01")
                    me = getdate(add_months(ms, 1))
                    if ms < cmp_start: ms = cmp_start
                    if me > cmp_end: me = cmp_end
                    if ms < me:
                        ranges.append((ms, me))
        else:
            # Default: shift back 1 FY
            for fy_val in selected_ytd_fys.split(","):
                fy_val = fy_val.strip()
                fy_parts = fy_val.split("_")
                if len(fy_parts) == 2:
                    ytd_start = getdate(fy_parts[0])
                    ytd_end = getdate(fy_parts[1])
                    prev_start = ytd_start.replace(year=ytd_start.year - 1)
                    prev_end = ytd_end.replace(year=ytd_end.year - 1)
                    for m_idx in range(12):
                        actual_month, year_offset = FY_MONTH_MAP[m_idx]
                        yr = prev_start.year + year_offset
                        ms = getdate(f"{yr}-{actual_month:02d}-01")
                        me = getdate(add_months(ms, 1))
                        if ms < prev_start: ms = prev_start
                        if me > prev_end: me = prev_end
                        if ms < me:
                            ranges.append((ms, me))

    else:
        # Fallback: shift back by 1 period
        if fy_start:
            end = today_dt if today_dt < fy_end else fy_end
        else:
            end = today_dt
        ref_month = end.month
        if period == "QTD":
            q_month = ((ref_month - 1) // 3) * 3 + 1
            start = end.replace(month=q_month, day=1)
            prev_start = start.replace(month=max(1, start.month - 3))
            prev_end = start
        elif period == "YTD":
            if fy_start:
                start = fy_start
            else:
                start_year = today_dt.year if today_dt.month >= 4 else today_dt.year - 1
                start = getdate(f"{start_year}-04-01")
            prev_start = start.replace(year=start.year - 1)
            prev_end = end.replace(year=end.year - 1)
        else:
            start = end.replace(day=1)
            prev_start = start.replace(month=max(1, start.month - 1))
            prev_end = start
        if fy_start and prev_start < fy_start:
            prev_start = fy_start
        if prev_start > prev_end:
            prev_start = prev_end
        ranges.append((prev_start, prev_end))

    if not ranges:
        return "", []

    conditions = []
    args = []
    for ms, me in ranges:
        conditions.append(f"{alias}.posting_date >= %s AND {alias}.posting_date < %s")
        args.extend([ms, me])

    return "AND (" + " OR ".join(conditions) + ")", args
