import frappe
from frappe.utils import flt


@frappe.whitelist()
def get_swastik_total():
    """Get total reserved quantity across all companies for all items (Swastik tracking)."""
    result = frappe.db.sql(
        """
        SELECT
            COALESCE(SUM(reserved_qty), 0) as total_reserved,
            COUNT(*) as total_reservations,
            COUNT(DISTINCT company) as companies_count,
            COUNT(DISTINCT item) as items_count
        FROM `tabStock Reservation`
        WHERE docstatus = 1 AND status = 'Reserved'
        """,
        as_dict=True,
    )
    data = result[0] if result else {"total_reserved": 0, "total_reservations": 0, "companies_count": 0, "items_count": 0}

    # Per-company breakdown
    company_data = frappe.db.sql(
        """
        SELECT
            company,
            COALESCE(SUM(reserved_qty), 0) as total_reserved,
            COUNT(*) as reservations,
            COUNT(DISTINCT item) as items
        FROM `tabStock Reservation`
        WHERE docstatus = 1 AND status = 'Reserved'
        GROUP BY company
        ORDER BY total_reserved DESC
        """,
        as_dict=True,
    )

    # Per-item breakdown
    item_data = frappe.db.sql(
        """
        SELECT
            item,
            COALESCE(SUM(reserved_qty), 0) as total_reserved,
            COUNT(*) as reservations,
            COUNT(DISTINCT company) as companies
        FROM `tabStock Reservation`
        WHERE docstatus = 1 AND status = 'Reserved'
        GROUP BY item
        ORDER BY total_reserved DESC
        """,
        as_dict=True,
    )

    return {
        "total_reserved": flt(data.total_reserved),
        "total_reservations": data.total_reservations,
        "companies_count": data.companies_count,
        "items_count": data.items_count,
        "by_company": company_data,
        "by_item": item_data,
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
