import frappe
from frappe import _


# ─── Helpers ───────────────────────────────────────────────

def _parse_csv(val):
	if not val or val == "All":
		return []
	if isinstance(val, list):
		return val
	return [v.strip() for v in val.split(",") if v.strip()]


def _co_where(label="si.company"):
	company = frappe.form_dict.get("company", "All")
	vals = _parse_csv(company)
	if vals:
		placeholders = ", ".join(["%s"] * len(vals))
		return f"AND {label} IN ({placeholders})", vals
	return "", []


# ─── Procurement ───────────────────────────────────────────

@frappe.whitelist()
def get_procurement_kpis():
	company = frappe.form_dict.get("company", "All")
	co_where, co_vals = _co_where("company")

	data = frappe.db.sql(f"""
		SELECT
			COALESCE(SUM(base_grand_total), 0) as total_spend,
			COUNT(*) as po_count
		FROM `tabPurchase Order`
		WHERE docstatus = 1
		{co_where}
	""", co_vals, as_dict=True)

	pending = frappe.db.sql(f"""
		SELECT COUNT(*) as pending
		FROM `tabPurchase Order`
		WHERE docstatus = 1 AND status NOT IN ('Completed', 'Closed', 'Cancelled')
		{co_where}
	""", co_vals, as_dict=True)

	suppliers = frappe.db.sql(f"""
		SELECT COUNT(DISTINCT supplier) as cnt
		FROM `tabPurchase Order`
		WHERE docstatus = 1
		{co_where}
	""", co_vals, as_dict=True)

	result = data[0]
	return {
		"total_spend": result["total_spend"],
		"po_count": result["po_count"],
		"pending_pos": pending[0]["pending"],
		"supplier_count": suppliers[0]["cnt"],
		"spend_change": None,
	}


@frappe.whitelist()
def get_pending_purchase_orders():
	limit = frappe.form_dict.get("limit", 20)
	co_where, co_vals = _co_where("company")

	rows = frappe.db.sql(f"""
		SELECT name, supplier, supplier_name, base_grand_total as total,
			status, transaction_date
		FROM `tabPurchase Order`
		WHERE docstatus = 1 AND status NOT IN ('Completed', 'Closed', 'Cancelled')
		{co_where}
		ORDER BY transaction_date DESC
		LIMIT %s
	""", co_vals + [int(limit)], as_dict=True)

	for r in rows:
		r["supplier"] = r.get("supplier_name") or r["supplier"]
	return rows


@frappe.whitelist()
def get_recent_purchase_receipts():
	limit = frappe.form_dict.get("limit", 20)
	co_where, co_vals = _co_where("company")

	rows = frappe.db.sql(f"""
		SELECT name, supplier, supplier_name, base_grand_total as total,
			status, posting_date
		FROM `tabPurchase Receipt`
		WHERE docstatus = 1
		{co_where}
		ORDER BY posting_date DESC
		LIMIT %s
	""", co_vals + [int(limit)], as_dict=True)

	for r in rows:
		r["supplier"] = r.get("supplier_name") or r["supplier"]
	return rows


@frappe.whitelist()
def create_purchase_order():
	data = frappe.local.form_dict
	po = frappe.get_doc({
		"doctype": "Purchase Order",
		"supplier": data.get("supplier"),
		"company": data.get("company"),
		"transaction_date": frappe.utils.nowdate(),
		"items": [],
	})
	for item in data.get("items", []):
		po.append("items", {
			"item_code": item.get("item_code"),
			"qty": float(item.get("qty", 1)),
			"rate": float(item.get("rate", 0)),
			"schedule_date": frappe.utils.nowdate(),
		})
	po.insert()
	po.submit()
	return {"name": po.name, "status": po.status}


# ─── Sales ─────────────────────────────────────────────────

@frappe.whitelist()
def get_sales_kpis():
	co_where, co_vals = _co_where("company")

	data = frappe.db.sql(f"""
		SELECT COALESCE(SUM(base_grand_total), 0) as total_sales,
			COUNT(*) as so_count
		FROM `tabSales Order`
		WHERE docstatus = 1
		{co_where}
	""", co_vals, as_dict=True)

	pending = frappe.db.sql(f"""
		SELECT COUNT(*) as pending
		FROM `tabSales Order`
		WHERE docstatus = 1 AND status NOT IN ('Completed', 'Closed', 'Cancelled')
		{co_where}
	""", co_vals, as_dict=True)

	customers = frappe.db.sql(f"""
		SELECT COUNT(DISTINCT customer) as cnt
		FROM `tabSales Order`
		WHERE docstatus = 1
		{co_where}
	""", co_vals, as_dict=True)

	result = data[0]
	return {
		"total_sales": result["total_sales"],
		"so_count": result["so_count"],
		"pending_sos": pending[0]["pending"],
		"customer_count": customers[0]["cnt"],
		"sales_change": None,
	}


@frappe.whitelist()
def get_pending_sales_orders():
	limit = frappe.form_dict.get("limit", 20)
	co_where, co_vals = _co_where("company")

	rows = frappe.db.sql(f"""
		SELECT name, customer, customer_name, base_grand_total as total,
			status, transaction_date
		FROM `tabSales Order`
		WHERE docstatus = 1 AND status NOT IN ('Completed', 'Closed', 'Cancelled')
		{co_where}
		ORDER BY transaction_date DESC
		LIMIT %s
	""", co_vals + [int(limit)], as_dict=True)

	for r in rows:
		r["customer"] = r.get("customer_name") or r["customer"]
	return rows


@frappe.whitelist()
def get_recent_delivery_notes():
	limit = frappe.form_dict.get("limit", 20)
	co_where, co_vals = _co_where("company")

	rows = frappe.db.sql(f"""
		SELECT name, customer, customer_name, base_grand_total as total,
			status, posting_date
		FROM `tabDelivery Note`
		WHERE docstatus = 1
		{co_where}
		ORDER BY posting_date DESC
		LIMIT %s
	""", co_vals + [int(limit)], as_dict=True)

	for r in rows:
		r["customer"] = r.get("customer_name") or r["customer"]
	return rows


@frappe.whitelist()
def get_top_customers():
	limit = frappe.form_dict.get("limit", 10)
	co_where, co_vals = _co_where("si.company")

	rows = frappe.db.sql(f"""
		SELECT si.customer, si.customer_name,
			COALESCE(SUM(si.base_grand_total), 0) as total_amount,
			COUNT(DISTINCT si.name) as invoice_count
		FROM `tabSales Invoice` si
		WHERE si.docstatus = 1
		{co_where}
		GROUP BY si.customer, si.customer_name
		ORDER BY total_amount DESC
		LIMIT %s
	""", co_vals + [int(limit)], as_dict=True)

	for r in rows:
		r["customer_name"] = r.get("customer_name") or r["customer"]
	return rows


@frappe.whitelist()
def create_sales_order():
	data = frappe.local.form_dict
	so = frappe.get_doc({
		"doctype": "Sales Order",
		"customer": data.get("customer"),
		"company": data.get("company"),
		"transaction_date": frappe.utils.nowdate(),
		"delivery_date": frappe.utils.add_days(frappe.utils.nowdate(), 7),
		"items": [],
	})
	for item in data.get("items", []):
		so.append("items", {
			"item_code": item.get("item_code"),
			"qty": float(item.get("qty", 1)),
			"rate": float(item.get("rate", 0)),
		})
	so.insert()
	so.submit()
	return {"name": so.name, "status": so.status}


# ─── Inter Company Transfer ──────────────────────────────

@frappe.whitelist()
def get_ict_kpis():
	company = frappe.form_dict.get("company", "All")
	co_vals_in = _parse_csv(company)

	if co_vals_in:
		placeholders = ", ".join(["%s"] * len(co_vals_in))
		co_cond = f"AND (company IN ({placeholders}) OR to_company IN ({placeholders}))"
		co_args = co_vals_in + co_vals_in
	else:
		co_cond = ""
		co_args = []

	data = frappe.db.sql(f"""
		SELECT
			COALESCE(SUM(total_qty), 0) as total_volume,
			COALESCE(SUM(grand_total), 0) as ict_value,
			COUNT(*) as ict_count,
			COUNT(DISTINCT CONCAT(company, '→', to_company)) as active_routes,
			SUM(CASE WHEN status != 'Submitted' THEN 1 ELSE 0 END) as pending_icts
		FROM `tabInter Company Transfer`
		WHERE docstatus = 1
		{co_cond}
	""", co_args, as_dict=True)

	return data[0]


@frappe.whitelist()
def get_ict_routes():
	company = frappe.form_dict.get("company", "All")
	co_vals_in = _parse_csv(company)

	if co_vals_in:
		placeholders = ", ".join(["%s"] * len(co_vals_in))
		co_cond = f"AND (company IN ({placeholders}) OR to_company IN ({placeholders}))"
		co_args = co_vals_in + co_vals_in
	else:
		co_cond = ""
		co_args = []

	rows = frappe.db.sql(f"""
		SELECT company, to_company,
			COUNT(*) as cnt,
			COALESCE(SUM(total_qty), 0) as qty,
			COALESCE(SUM(grand_total), 0) as value
		FROM `tabInter Company Transfer`
		WHERE docstatus = 1
		{co_cond}
		GROUP BY company, to_company
		ORDER BY qty DESC
	""", co_args, as_dict=True)

	return rows


@frappe.whitelist()
def get_ict_list():
	limit = frappe.form_dict.get("limit", 30)
	company = frappe.form_dict.get("company", "All")
	co_vals_in = _parse_csv(company)

	if co_vals_in:
		placeholders = ", ".join(["%s"] * len(co_vals_in))
		co_cond = f"AND (company IN ({placeholders}) OR to_company IN ({placeholders}))"
		co_args = co_vals_in + co_vals_in
	else:
		co_cond = ""
		co_args = []

	rows = frappe.db.sql(f"""
		SELECT name, company, to_company, total_qty, grand_total,
			status, posting_date
		FROM `tabInter Company Transfer`
		WHERE docstatus = 1
		{co_cond}
		ORDER BY posting_date DESC
		LIMIT %s
	""", co_args + [int(limit)], as_dict=True)

	return rows


@frappe.whitelist()
def create_inter_company_transfer():
	data = frappe.local.form_dict

	ict = frappe.get_doc({
		"doctype": "Inter Company Transfer",
		"company": data.get("company"),
		"to_company": data.get("to_company"),
		"posting_date": frappe.utils.nowdate(),
		"items": [],
	})

	for item in data.get("items", []):
		ict.append("items", {
			"item_code": item.get("item_code"),
			"qty": float(item.get("qty", 1)),
			"rate": float(item.get("rate", 0)),
			"source_warehouse": item.get("source_warehouse"),
			"target_warehouse": item.get("target_warehouse"),
		})

	ict.insert()
	ict.submit()
	return {"name": ict.name, "status": ict.status}


# ─── Stock Reservation ─────────────────────────────────────

@frappe.whitelist()
def get_reservation_kpis():
	company = frappe.form_dict.get("company", "All")
	co_where, co_vals = _co_where("company")

	data = frappe.db.sql(f"""
		SELECT
			COALESCE(SUM(reserved_qty), 0) as total_reserved_qty,
			COUNT(*) as active_count
		FROM `tabStock Reservation`
		WHERE docstatus = 1 AND status = 'Reserved'
		{co_where}
	""", co_vals, as_dict=True)

	# Reserved value from Bin
	val = frappe.db.sql("""
		SELECT COALESCE(SUM(b.stock_value), 0) as total_value
		FROM `tabBin` b
		JOIN `tabWarehouse` w ON w.name = b.warehouse
		WHERE w.warehouse_name LIKE 'Reserved WH%'
	""", as_dict=True)

	# Utilization
	total = frappe.db.sql("""
		SELECT COALESCE(SUM(b.actual_qty), 0) as total_stock
		FROM `tabBin` b
		JOIN `tabWarehouse` w ON w.name = b.warehouse
		WHERE w.warehouse_name LIKE '%% WH - %%'
	""", as_dict=True)

	reserved_qty = frappe.db.sql("""
		SELECT COALESCE(SUM(b.actual_qty), 0) as reserved_qty
		FROM `tabBin` b
		JOIN `tabWarehouse` w ON w.name = b.warehouse
		WHERE w.warehouse_name LIKE 'Reserved WH%'
	""", as_dict=True)

	total_stock = total[0]["total_stock"]
	res_qty = reserved_qty[0]["reserved_qty"]
	util = (res_qty / total_stock * 100) if total_stock > 0 else 0

	return {
		"total_reserved_qty": data[0]["total_reserved_qty"],
		"total_reserved_value": val[0]["total_value"],
		"utilization_pct": round(util, 1),
		"active_count": data[0]["active_count"],
	}


@frappe.whitelist()
def get_reserved_by_company():
	rows = frappe.db.sql("""
		SELECT w.company,
			COALESCE(SUM(b.actual_qty), 0) as qty,
			COALESCE(SUM(b.stock_value), 0) as value
		FROM `tabBin` b
		JOIN `tabWarehouse` w ON w.name = b.warehouse
		WHERE w.warehouse_name LIKE 'Reserved WH%'
		GROUP BY w.company
		ORDER BY qty DESC
	""", as_dict=True)
	return rows


@frappe.whitelist()
def get_active_reservations():
	limit = frappe.form_dict.get("limit", 30)
	co_where, co_vals = _co_where("company")

	rows = frappe.db.sql(f"""
		SELECT name, company, item, reserved_qty, reserved_for, status, warehouse
		FROM `tabStock Reservation`
		WHERE docstatus = 1 AND status = 'Reserved'
		{co_where}
		ORDER BY creation DESC
		LIMIT %s
	""", co_vals + [int(limit)], as_dict=True)

	return rows


@frappe.whitelist()
def create_stock_reservation():
	data = frappe.local.form_dict
	company = data.get("company")
	abbr_map = {"Geeta Enterprise": "GE", "Global Export": "GEX", "Shubham Enterprise": "SHE"}
	abbr = abbr_map.get(company)

	sr = frappe.get_doc({
		"doctype": "Stock Reservation",
		"company": company,
		"warehouse": f"Reserved WH - {abbr}",
		"reserved_warehouse": f"Reserved WH - {abbr}",
		"item": data.get("item"),
		"reserved_qty": float(data.get("reserved_qty", 1)),
		"reserved_for": data.get("reserved_for"),
		"posting_date": frappe.utils.nowdate(),
	})
	sr.insert()
	sr.submit()
	return {"name": sr.name, "status": sr.status}


# ─── Dropdown Data ──────────────────────────────────────────

@frappe.whitelist()
def get_companies():
	return frappe.get_all("Company", pluck="name")


@frappe.whitelist()
def get_items():
	items = frappe.get_all("Item",
		fields=["name", "item_name", "stock_uom"],
		limit_page_length=200,
		order_by="name asc",
	)
	return items


@frappe.whitelist()
def get_customers():
	return frappe.get_all("Customer",
		fields=["name", "customer_name", "customer_type", "territory", "customer_group"],
		limit_page_length=500,
		order_by="name asc",
	)


@frappe.whitelist()
def get_suppliers():
	return frappe.get_all("Supplier",
		fields=["name", "supplier_name", "supplier_type", "payment_terms"],
		limit_page_length=500,
		order_by="name asc",
	)


@frappe.whitelist()
def get_warehouses():
	warehouses = frappe.get_all("Warehouse",
		fields=["name", "warehouse_name", "company"],
		limit_page_length=300,
		order_by="name asc",
	)
	return warehouses


@frappe.whitelist()
def get_item_rate(item_code=None, company=None):
	"""Fetch standard buying/selling rate for an item."""
	if not item_code:
		return {"rate": 0}
	rate = frappe.db.get_value("Item Price", {
		"item_code": item_code,
		"price_list": "Standard Buying",
		"selling": 0,
	}, "price_list_rate")
	return {"rate": rate or 0}


@frappe.whitelist()
def get_company_warehouses(company=None):
	if not company:
		return []
	warehouses = frappe.get_all("Warehouse",
		filters={"company": company, "is_group": 0, "disabled": 0},
		fields=["name", "warehouse_name"],
		limit_page_length=100,
	)
	return warehouses


# ─── Command Center ───────────────────────────────────────

@frappe.whitelist()
def get_command_center_kpis():
    company = frappe.form_dict.get("company", "All")
    co_vals = _parse_csv(company)
    co_cond = ""
    co_args = []
    if co_vals:
        placeholders = ", ".join(["%s"] * len(co_vals))
        co_cond = f"AND company IN ({placeholders})"
        co_args = co_vals

    sales_mtd = frappe.db.sql(f"""
        SELECT COALESCE(SUM(base_grand_total), 0) as total
        FROM `tabSales Invoice`
        WHERE docstatus = 1 AND MONTH(posting_date) = MONTH(CURDATE())
            AND YEAR(posting_date) = YEAR(CURDATE()) {co_cond}
    """, co_args, as_dict=True)

    procurement_mtd = frappe.db.sql(f"""
        SELECT COALESCE(SUM(base_grand_total), 0) as total
        FROM `tabPurchase Invoice`
        WHERE docstatus = 1 AND MONTH(posting_date) = MONTH(CURDATE())
            AND YEAR(posting_date) = YEAR(CURDATE()) {co_cond}
    """, co_args, as_dict=True)

    avail = frappe.db.sql("""
        SELECT COALESCE(SUM(b.actual_qty), 0) as qty
        FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE w.warehouse_name LIKE 'Available WH - %'
    """, as_dict=True)

    reserved = frappe.db.sql("""
        SELECT COALESCE(SUM(b.actual_qty), 0) as qty
        FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE w.warehouse_name LIKE 'Reserved WH - %'
    """, as_dict=True)

    ict = frappe.db.sql("""
        SELECT COALESCE(SUM(total_qty), 0) as qty
        FROM `tabInter Company Transfer`
        WHERE docstatus = 1 AND MONTH(posting_date) = MONTH(CURDATE())
            AND YEAR(posting_date) = YEAR(CURDATE())
    """, as_dict=True)

    neg = frappe.db.sql("""
        SELECT COUNT(*) as cnt FROM `tabBin` b
        JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE b.actual_qty < 0
    """, as_dict=True)

    sales_by_co = frappe.db.sql("""
        SELECT company, COALESCE(SUM(base_grand_total), 0) as total
        FROM `tabSales Invoice`
        WHERE docstatus = 1 AND MONTH(posting_date) = MONTH(CURDATE())
            AND YEAR(posting_date) = YEAR(CURDATE())
        GROUP BY company
    """, as_dict=True)

    procurement_by_co = frappe.db.sql("""
        SELECT company, COALESCE(SUM(base_grand_total), 0) as total
        FROM `tabPurchase Invoice`
        WHERE docstatus = 1 AND MONTH(posting_date) = MONTH(CURDATE())
            AND YEAR(posting_date) = YEAR(CURDATE())
        GROUP BY company
    """, as_dict=True)

    top_items = frappe.db.sql("""
        SELECT sii.item_code, SUM(sii.qty) as qty, SUM(sii.base_amount) as revenue
        FROM `tabSales Invoice Item` sii
        JOIN `tabSales Invoice` si ON si.name = sii.parent
        WHERE si.docstatus = 1 AND MONTH(si.posting_date) = MONTH(CURDATE())
            AND YEAR(si.posting_date) = YEAR(CURDATE())
        GROUP BY sii.item_code
        ORDER BY revenue DESC LIMIT 5
    """, as_dict=True)

    profit_loss = frappe.db.sql(f"""
        SELECT COALESCE(SUM(base_grand_total), 0) as total
        FROM `tabSales Invoice`
        WHERE docstatus = 1 AND MONTH(posting_date) = MONTH(CURDATE())
            AND YEAR(posting_date) = YEAR(CURDATE()) {co_cond}
    """, co_args, as_dict=True)

    prev_period = frappe.db.sql("""
        SELECT
            COALESCE(SUM(CASE WHEN dt = 'Sales' THEN base_grand_total ELSE 0 END), 0) as sales_prev,
            COALESCE(SUM(CASE WHEN dt = 'Procurement' THEN base_grand_total ELSE 0 END), 0) as procurement_prev
        FROM (
            SELECT base_grand_total, 'Sales' as dt
            FROM `tabSales Invoice`
            WHERE docstatus = 1 AND MONTH(posting_date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
                AND YEAR(posting_date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
            UNION ALL
            SELECT base_grand_total, 'Procurement' as dt
            FROM `tabPurchase Invoice`
            WHERE docstatus = 1 AND MONTH(posting_date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
                AND YEAR(posting_date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
        ) t
    """, as_dict=True)

    return {
        "profit_loss": profit_loss[0]["total"] - procurement_mtd[0]["total"],
        "sales_mtd": sales_mtd[0]["total"],
        "procurement_mtd": procurement_mtd[0]["total"],
        "sales_prev": prev_period[0]["sales_prev"],
        "procurement_prev": prev_period[0]["procurement_prev"],
        "profit_loss_prev": prev_period[0]["sales_prev"] - prev_period[0]["procurement_prev"],
        "available_stock": avail[0]["qty"],
        "reserved_stock": reserved[0]["qty"],
        "intercompany_volume": ict[0]["qty"],
        "negative_alerts": neg[0]["cnt"],
        "sales_by_company": sales_by_co,
        "procurement_by_company": procurement_by_co,
        "top_items": top_items,
    }


@frappe.whitelist()
def get_negative_stock():
    rows = frappe.db.sql("""
        SELECT b.item_code, w.warehouse_name as warehouse, b.actual_qty
        FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE b.actual_qty < 0
        ORDER BY b.actual_qty ASC LIMIT 30
    """, as_dict=True)
    return rows


# ─── Stock Dashboard ─────────────────────────────────────

@frappe.whitelist()
def get_stock_kpis():
    avail = frappe.db.sql("""
        SELECT COALESCE(SUM(b.actual_qty), 0) as qty, COALESCE(SUM(b.stock_value), 0) as val
        FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE w.warehouse_name LIKE 'Available WH - %' AND b.actual_qty > 0
    """, as_dict=True)

    reserved = frappe.db.sql("""
        SELECT COALESCE(SUM(b.actual_qty), 0) as qty, COALESCE(SUM(b.stock_value), 0) as val
        FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE w.warehouse_name LIKE 'Reserved WH - %' AND b.actual_qty > 0
    """, as_dict=True)

    total = frappe.db.sql("""
        SELECT COALESCE(SUM(b.actual_qty), 0) as qty
        FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
    """, as_dict=True)

    items = frappe.db.sql("""
        SELECT COUNT(DISTINCT b.item_code) as cnt
        FROM `tabBin` b JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE b.actual_qty > 0
    """, as_dict=True)

    wh_count = frappe.db.sql("""
        SELECT COUNT(*) as cnt FROM `tabWarehouse` WHERE is_group = 0 AND disabled = 0
    """, as_dict=True)

    neg = frappe.db.sql("""
        SELECT COUNT(*) as cnt FROM `tabBin` b
        JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE b.actual_qty < 0
    """, as_dict=True)

    total_stock = total[0]["qty"]
    res_qty = reserved[0]["qty"]
    util = (res_qty / total_stock * 100) if total_stock > 0 else 0

    return {
        "available_qty": avail[0]["qty"],
        "available_value": avail[0]["val"],
        "reserved_qty": reserved[0]["qty"],
        "reserved_value": reserved[0]["val"],
        "total_value": avail[0]["val"] + reserved[0]["val"],
        "utilization_pct": round(util, 1),
        "items_count": items[0]["cnt"],
        "warehouse_count": wh_count[0]["cnt"],
        "negative_count": neg[0]["cnt"],
    }


@frappe.whitelist()
def get_stock_by_company():
    rows = frappe.db.sql("""
        SELECT w.company,
            COALESCE(SUM(CASE WHEN w.warehouse_name LIKE 'Available WH - %' THEN b.actual_qty ELSE 0 END), 0) as avail_qty,
            COALESCE(SUM(CASE WHEN w.warehouse_name LIKE 'Available WH - %' THEN b.stock_value ELSE 0 END), 0) as avail_val,
            COALESCE(SUM(CASE WHEN w.warehouse_name LIKE 'Reserved WH - %' THEN b.actual_qty ELSE 0 END), 0) as reserved_qty,
            COALESCE(SUM(CASE WHEN w.warehouse_name LIKE 'Reserved WH - %' THEN b.stock_value ELSE 0 END), 0) as reserved_val,
            COUNT(DISTINCT b.item_code) as item_count
        FROM `tabBin` b
        JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE b.actual_qty != 0
        GROUP BY w.company
        ORDER BY avail_qty DESC
    """, as_dict=True)
    return rows


@frappe.whitelist()
def get_stock_by_warehouse():
    rows = frappe.db.sql("""
        SELECT w.warehouse_name as warehouse, w.company,
            COALESCE(SUM(b.actual_qty), 0) as total_qty,
            COALESCE(SUM(b.stock_value), 0) as total_value,
            COUNT(DISTINCT b.item_code) as item_count
        FROM `tabBin` b
        JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE b.actual_qty != 0
        GROUP BY w.warehouse_name, w.company
        ORDER BY total_qty DESC LIMIT 30
    """, as_dict=True)
    return rows


# ─── Command Center KPIs ──────────────────────────────────

@frappe.whitelist()
def get_dashboard_kpis():
	co_filter, co_args = _co_where("company")

	pending_po = frappe.db.sql(f"""
		SELECT COUNT(*) as cnt FROM `tabPurchase Order`
		WHERE docstatus = 1 AND status NOT IN ('Completed','Closed','Cancelled') {co_filter}
	""", co_args, as_dict=True)
	pending_so = frappe.db.sql(f"""
		SELECT COUNT(*) as cnt FROM `tabSales Order`
		WHERE docstatus = 1 AND status NOT IN ('Completed','Closed','Cancelled') {co_filter}
	""", co_args, as_dict=True)
	ict = frappe.db.sql(f"""
		SELECT COUNT(*) as cnt FROM `tabInter Company Transfer`
		WHERE docstatus = 1 {co_filter}
	""", co_args, as_dict=True)
	res = frappe.db.sql(f"""
		SELECT COUNT(*) as cnt FROM `tabStock Reservation`
		WHERE docstatus = 1 AND status = 'Reserved' {co_filter}
	""", co_args, as_dict=True)

	return {
		"pending_purchase_orders": pending_po[0]["cnt"],
		"pending_sales_orders": pending_so[0]["cnt"],
		"ict_transfers": ict[0]["cnt"],
		"active_reservations": res[0]["cnt"],
	}



