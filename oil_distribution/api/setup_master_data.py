import frappe
from frappe.utils import today, nowdate, flt

COMPANIES = {
    "Geeta Enterprise": "GE",
    "Global Export": "GEX",
    "Shubham Enterprise": "SHE",
    "Swastik": "SWK",
}


def setup_master_data():
    """Create all master data needed for oil distribution testing."""
    print("=" * 60)
    print("SETTING UP MASTER DATA")
    print("=" * 60)

    # 1. Companies
    print("\n--- Companies ---")
    for company_name, abbr in COMPANIES.items():
        if not frappe.db.exists("Company", company_name):
            doc = frappe.get_doc({
                "doctype": "Company",
                "company_name": company_name,
                "abbr": abbr,
                "default_currency": "INR",
                "country": "India",
            })
            doc.insert(ignore_permissions=True)
            print(f"  Created: {company_name} ({abbr})")
    frappe.db.commit()

    # 2. Warehouses
    print("\n--- Warehouses ---")
    for company_name, abbr in COMPANIES.items():
        for wh_type in ["Available", "Reserved"]:
            wh_name = f"{wh_type} WH - {abbr}"
            if not frappe.db.exists("Warehouse", wh_name):
                doc = frappe.get_doc({
                    "doctype": "Warehouse",
                    "warehouse_name": f"{wh_type} WH",
                    "company": company_name,
                })
                doc.insert(ignore_permissions=True)
                print(f"  Created: {wh_name}")
    frappe.db.commit()

    # 3. HSN Codes
    print("\n--- HSN Codes ---")
    for hsn in ["150910", "150810", "151210", "151800"]:
        if not frappe.db.exists("GST HSN Code", hsn):
            frappe.get_doc({"doctype": "GST HSN Code", "hsn_code": hsn, "description": f"Oil {hsn}", "uom": "Nos"}).insert(ignore_permissions=True)
            print(f"  Created: {hsn}")
    frappe.db.commit()

    # 4. Items with valuation rates
    print("\n--- Items ---")
    items = [
        {"item_code": "OIL-MUSTARD", "item_name": "Mustard Oil", "hsn": "150910", "val_rate": 180},
        {"item_code": "OIL-GROUNDNUT", "item_name": "Groundnut Oil", "hsn": "150810", "val_rate": 200},
        {"item_code": "OIL-SUNFLOWER", "item_name": "Sunflower Oil", "hsn": "151210", "val_rate": 160},
        {"item_code": "OIL-CASTOR", "item_name": "Castor Oil", "hsn": "151800", "val_rate": 220},
    ]
    for item_data in items:
        if not frappe.db.exists("Item", item_data["item_code"]):
            doc = frappe.get_doc({
                "doctype": "Item",
                "item_code": item_data["item_code"],
                "item_name": item_data["item_name"],
                "item_group": "All Item Groups",
                "stock_uom": "Nos",
                "is_stock_item": 1,
                "gst_hsn_code": item_data["hsn"],
                "valuation_rate": item_data["val_rate"],
            })
            doc.insert(ignore_permissions=True)
            print(f"  Created: {item_data['item_code']} (val_rate={item_data['val_rate']})")
        else:
            # Ensure valuation rate is set
            frappe.db.set_value("Item", item_data["item_code"], "valuation_rate", item_data["val_rate"])
            print(f"  Exists:  {item_data['item_code']} (val_rate updated to {item_data['val_rate']})")
    frappe.db.commit()

    # 5. Inter-Company Supplier/Customer Pairs
    print("\n--- Inter-Company Links ---")
    pairs = [
        ("Geeta Enterprise", "Global Export"),
        ("Geeta Enterprise", "Shubham Enterprise"),
        ("Global Export", "Geeta Enterprise"),
        ("Global Export", "Shubham Enterprise"),
        ("Shubham Enterprise", "Geeta Enterprise"),
        ("Shubham Enterprise", "Global Export"),
    ]
    for supplier_co, customer_co in pairs:
        sup_abbr = COMPANIES[supplier_co]
        cust_abbr = COMPANIES[customer_co]
        sup_name = f"{sup_abbr} Supplier"
        if not frappe.db.exists("Supplier", sup_name):
            sup = frappe.get_doc({
                "doctype": "Supplier", "supplier_name": sup_name,
                "supplier_group": "Local", "is_internal_supplier": 1,
                "represents_company": supplier_co,
            })
            sup.append("companies", {"company": customer_co})
            sup.insert(ignore_permissions=True)
            print(f"  Created Supplier: {sup_name}")
        else:
            # Ensure allowed company is set
            sup = frappe.get_doc("Supplier", sup_name)
            existing_companies = [d.company for d in sup.get("companies", [])]
            if customer_co not in existing_companies:
                sup.append("companies", {"company": customer_co})
                sup.save(ignore_permissions=True)

        cust_name = f"{cust_abbr} Customer"
        if not frappe.db.exists("Customer", cust_name):
            cust = frappe.get_doc({
                "doctype": "Customer", "customer_name": cust_name,
                "customer_group": "Commercial", "territory": "India",
                "is_internal_customer": 1, "represents_company": customer_co,
            })
            cust.append("companies", {"company": supplier_co})
            cust.insert(ignore_permissions=True)
            print(f"  Created Customer: {cust_name}")
        else:
            # Ensure allowed company is set
            cust = frappe.get_doc("Customer", cust_name)
            existing_companies = [d.company for d in cust.get("companies", [])]
            if supplier_co not in existing_companies:
                cust.append("companies", {"company": supplier_co})
                cust.save(ignore_permissions=True)
    frappe.db.commit()

    # 6. Price Lists (Standard Selling + Standard Buying with both flags)
    print("\n--- Price Lists ---")
    for pl_name in ["Standard Selling", "Standard Buying"]:
        if frappe.db.exists("Price List", pl_name):
            frappe.db.set_value("Price List", pl_name, {"selling": 1, "buying": 1, "enabled": 1})
            print(f"  Updated: {pl_name} (selling=1, buying=1)")

    # Set default price lists on Selling/Buying Settings
    if frappe.db.exists("Selling Settings"):
        frappe.db.set_value("Selling Settings", None, "selling_price_list", "Standard Selling")
    if frappe.db.exists("Buying Settings"):
        frappe.db.set_value("Buying Settings", None, "buying_price_list", "Standard Buying")
    frappe.db.commit()
    print("  Set default price lists on Selling/Buying Settings")

    # 7. Transfer Settings (singleton)
    print("\n--- Transfer Settings ---")
    ts = frappe.get_single("Transfer Settings")
    ts.company = "Geeta Enterprise"
    ts.default_source_warehouse = "Available WH - GE"
    ts.default_target_warehouse = "Available WH - GE"
    ts.auto_create_intercompany_docs = 1
    ts.save(ignore_permissions=True)
    print("  Saved Transfer Settings for Geeta Enterprise")
    frappe.db.commit()

    # 7. Fiscal Year 2026
    print("\n--- Fiscal Year ---")
    if not frappe.db.exists("Fiscal Year", {"year": "2026"}):
        frappe.get_doc({
            "doctype": "Fiscal Year",
            "year": "2026",
            "year_start_date": "2026-04-01",
            "year_end_date": "2027-03-31",
        }).insert(ignore_permissions=True)
        print("  Created Fiscal Year 2026")
    else:
        print("  Exists Fiscal Year 2026")
    frappe.db.commit()

    # 8. Enable Allow Negative Stock
    print("\n--- Stock Settings ---")
    ss = frappe.get_single("Stock Settings")
    if not ss.allow_negative_stock:
        ss.allow_negative_stock = 1
        ss.save(ignore_permissions=True)
        print("  Enabled Allow Negative Stock")
    else:
        print("  Allow Negative Stock already enabled")
    frappe.db.commit()

    # 9. Opening Stock (Material Receipt with valuation rate)
    print("\n--- Opening Stock ---")
    stock_data = [
        ("Geeta Enterprise", "Available WH - GE", "OIL-MUSTARD", 500, 180),
        ("Geeta Enterprise", "Available WH - GE", "OIL-GROUNDNUT", 300, 200),
        ("Geeta Enterprise", "Available WH - GE", "OIL-SUNFLOWER", 200, 160),
        ("Geeta Enterprise", "Available WH - GE", "OIL-CASTOR", 100, 220),
        ("Global Export", "Available WH - GEX", "OIL-MUSTARD", 200, 180),
        ("Global Export", "Available WH - GEX", "OIL-SUNFLOWER", 150, 160),
        ("Shubham Enterprise", "Available WH - SHE", "OIL-GROUNDNUT", 250, 200),
        ("Shubham Enterprise", "Available WH - SHE", "OIL-CASTOR", 100, 220),
    ]
    for company_name, warehouse, item_code, qty, rate in stock_data:
        existing = frappe.db.get_value("Bin", {"item_code": item_code, "warehouse": warehouse}, "actual_qty") or 0
        if flt(existing) < qty:
            se = frappe.get_doc({
                "doctype": "Stock Entry",
                "stock_entry_type": "Material Receipt",
                "company": company_name,
                "posting_date": today(),
                "items": [{
                    "item_code": item_code,
                    "t_warehouse": warehouse,
                    "qty": qty - existing,
                    "uom": "Nos",
                    "transfer_qty": qty - existing,
                    "basic_rate": rate,
                }]
            })
            se.insert(ignore_permissions=True)
            se.submit()
            print(f"  {se.name}: {qty - existing} x {item_code} @ {rate}/unit -> {warehouse}")
        else:
            print(f"  OK: {item_code} in {warehouse} = {existing}")
    frappe.db.commit()

    print("\n" + "=" * 60)
    print("MASTER DATA SETUP COMPLETE")
    print("=" * 60)
    _print_summary()


def _print_summary():
    print(f"\nCompanies:     {frappe.db.count('Company')}")
    print(f"Warehouses:    {frappe.db.count('Warehouse')}")
    print(f"Items:         {frappe.db.count('Item')}")
    print(f"Suppliers:     {frappe.db.count('Supplier')}")
    print(f"Customers:     {frappe.db.count('Customer')}")
    print(f"Stock Entries: {frappe.db.count('Stock Entry', {'docstatus': 1})}")
