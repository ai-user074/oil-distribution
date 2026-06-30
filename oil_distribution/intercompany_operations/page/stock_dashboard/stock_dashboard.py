import frappe
from frappe.utils import flt


@frappe.whitelist()
def get_swastik_total():
    """Get total reserved stock from all Reserved Warehouses (actual Bin stock).
    Captures ALL material moved to Reserved WHs - via Stock Reservation AND manual transfers."""
    # Total from Bins
    total_result = frappe.db.sql(
        """
        SELECT COALESCE(SUM(b.actual_qty), 0) as total_reserved
        FROM `tabBin` b
        JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE w.name LIKE 'Reserved WH - %%'
        AND b.actual_qty > 0
        """,
        as_dict=True,
    )
    total_reserved = flt(total_result[0].total_reserved) if total_result else 0

    # Per-company breakdown from Bins
    company_data = frappe.db.sql(
        """
        SELECT
            w.company,
            COALESCE(SUM(b.actual_qty), 0) as total_reserved
        FROM `tabBin` b
        JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE w.name LIKE 'Reserved WH - %%'
        AND b.actual_qty > 0
        GROUP BY w.company
        ORDER BY total_reserved DESC
        """,
        as_dict=True,
    )

    # Per-item breakdown from Bins
    item_data = frappe.db.sql(
        """
        SELECT
            b.item_code as item,
            COALESCE(SUM(b.actual_qty), 0) as total_reserved
        FROM `tabBin` b
        JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE w.name LIKE 'Reserved WH - %%'
        AND b.actual_qty > 0
        GROUP BY b.item_code
        ORDER BY total_reserved DESC
        """,
        as_dict=True,
    )

    # Per-company per-item detail
    detail_data = frappe.db.sql(
        """
        SELECT
            w.company,
            b.item_code,
            b.warehouse,
            b.actual_qty as qty
        FROM `tabBin` b
        JOIN `tabWarehouse` w ON w.name = b.warehouse
        WHERE w.name LIKE 'Reserved WH - %%'
        AND b.actual_qty > 0
        ORDER BY w.company, b.item_code
        """,
        as_dict=True,
    )

    return {
        "total_reserved": total_reserved,
        "companies_count": len(company_data),
        "items_count": len(item_data),
        "by_company": company_data,
        "by_item": item_data,
        "detail": detail_data,
    }


@frappe.whitelist()
def get_stock_summary():
    """Get stock summary for all companies grouped by warehouse."""
    companies = frappe.get_all("Company", filters={}, fields=["name", "abbr"])
    result = []

    for company in companies:
        company_data = {
            "company": company.name,
            "abbr": company.abbr,
            "warehouses": [],
            "total_qty": 0,
            "total_value": 0,
        }

        warehouses = frappe.get_all(
            "Warehouse",
            filters={"company": company.name, "is_group": 0},
            fields=["name", "warehouse_name"],
            order_by="name",
        )

        for wh in warehouses:
            bins = frappe.get_all(
                "Bin",
                filters={"warehouse": wh.name},
                fields=["item_code", "actual_qty", "valuation_rate", "stock_value"],
            )
            # Filter out zero qty
            bins = [b for b in bins if b.actual_qty and flt(b.actual_qty) != 0]

            if bins:
                wh_data = {
                    "warehouse": wh.name,
                    "warehouse_name": wh.warehouse_name,
                    "items": [],
                    "total_qty": 0,
                    "total_value": 0,
                }
                for b in bins:
                    qty = flt(b.actual_qty)
                    value = flt(b.stock_value) or (qty * flt(b.valuation_rate))
                    wh_data["items"].append({
                        "item_code": b.item_code,
                        "qty": qty,
                        "valuation_rate": flt(b.valuation_rate),
                        "stock_value": value,
                        "is_negative": qty < 0,
                    })
                    wh_data["total_qty"] += qty
                    wh_data["total_value"] += value

                company_data["warehouses"].append(wh_data)
                company_data["total_qty"] += wh_data["total_qty"]
                company_data["total_value"] += wh_data["total_value"]

        result.append(company_data)

    return result


@frappe.whitelist()
def get_item_wise_summary():
    """Get item-wise stock summary across all companies."""
    data = frappe.db.sql(
        """
        select
            b.item_code,
            w.company,
            b.warehouse,
            b.actual_qty as qty,
            b.valuation_rate,
            b.stock_value
        from tabBin b
        join tabWarehouse w on w.name = b.warehouse
        where b.actual_qty != 0
        order by b.item_code, w.company, b.warehouse
        """,
        as_dict=True,
    )

    # Group by item
    items = {}
    for row in data:
        item = row.item_code
        if item not in items:
            items[item] = {"item_code": item, "companies": {}, "total_qty": 0, "total_value": 0}

        company = row.company
        if company not in items[item]["companies"]:
            items[item]["companies"][company] = {"qty": 0, "value": 0, "warehouses": []}

        qty = flt(row.qty)
        value = flt(row.stock_value) or (qty * flt(row.valuation_rate))

        items[item]["companies"][company]["qty"] += qty
        items[item]["companies"][company]["value"] += value
        items[item]["companies"][company]["warehouses"].append({
            "warehouse": row.warehouse,
            "qty": qty,
            "value": value,
        })
        items[item]["total_qty"] += qty
        items[item]["total_value"] += value

    return list(items.values())
