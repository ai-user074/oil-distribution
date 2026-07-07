import frappe
from frappe.utils import today, add_days

def execute():
    create_hsn()
    create_items()
    create_parties()
    create_selling_data()
    create_procurement_data()
    create_intercompany_transfers()
    frappe.db.commit()
    print("\n✅ Test data created successfully!")


def create_hsn():
    if not frappe.db.exists("GST HSN Code", "27101200"):
        frappe.get_doc({
            "doctype": "GST HSN Code",
            "hsn_code": "27101200",
            "description": "Lubricating preparations for hydraulic transmission, containing less than 70% by weight of petroleum oils",
            "gst_rate": 28,
        }).insert(ignore_permissions=True)
        print("  ✅ Created HSN Code: 27101200")
    else:
        print("  ⏭️  HSN Code exists: 27101200")


def create_parties():
    customers = ["Reliance Industries", "Tata Motors", "Bajaj Auto", "Mahindra & Mahindra", "Hero MotoCorp"]
    for c in customers:
        if not frappe.db.exists("Customer", c):
            doc = frappe.new_doc("Customer")
            doc.customer_name = c
            doc.customer_group = "Commercial"
            doc.territory = "India"
            doc.insert(ignore_permissions=True)
            print(f"  ✅ Created Customer: {c}")
        else:
            print(f"  ⏭️  Customer exists: {c}")

    suppliers = ["IOCL Distributor", "BPCL Dealer", "HPCL Supplier"]
    for s in suppliers:
        if not frappe.db.exists("Supplier", s):
            doc = frappe.new_doc("Supplier")
            doc.supplier_name = s
            doc.supplier_group = "All Supplier Groups"
            doc.territory = "India"
            doc.insert(ignore_permissions=True)
            print(f"  ✅ Created Supplier: {s}")
        else:
            print(f"  ⏭️  Supplier exists: {s}")


def create_items():
    items = [
        {"item_code": "IOCL-HP-15W40", "item_name": "IOCL HP 15W40", "item_group": "All Item Groups", "stock_uom": "Nos", "description": "IOCL HP 15W40 Engine Oil", "gst_hsn_code": "27101200"},
        {"item_code": "IOCL-XP-10W30", "item_name": "IOCL XP 10W30 Engine Oil", "item_group": "All Item Groups", "stock_uom": "Nos", "description": "IOCL XP 10W30 Premium Engine Oil", "gst_hsn_code": "27101200"},
        {"item_code": "IOCL-Ultra-10W40", "item_name": "IOCL Ultra 10W40", "item_group": "All Item Groups", "stock_uom": "Nos", "description": "IOCL Ultra 10W40 Synthetic Blend", "gst_hsn_code": "27101200"},
    ]
    for data in items:
        if not frappe.db.exists("Item", data["item_code"]):
            doc = frappe.new_doc("Item")
            doc.update(data)
            doc.insert(ignore_permissions=True)
            print(f"  ✅ Created Item: {data['item_code']}")
        else:
            print(f"  ⏭️  Item exists: {data['item_code']}")


def create_selling_data():
    companies = ["Geeta Enterprise", "Global Export", "Shubham Enterprise"]
    customers = ["Reliance Industries", "Tata Motors", "Bajaj Auto", "Mahindra & Mahindra", "Hero MotoCorp"]
    items = ["IOCL-HP-15W40", "IOCL-XP-10W30", "IOCL-Ultra-10W40"]
    wh_map = {"Geeta Enterprise": "Available WH - GE", "Global Export": "Available WH - GEX", "Shubham Enterprise": "Available WH - SHE"}

    for i, company in enumerate(companies):
        set_wh = wh_map.get(company, "")
        # Create 2 Sales Orders per company
        for j in range(2):
            customer = customers[(i * 2 + j) % len(customers)]
            try:
                so = frappe.new_doc("Sales Order")
                so.customer = customer
                so.company = company
                so.set_warehouse = set_wh
                so.transaction_date = today()
                so.delivery_date = add_days(today(), 7)
                so.append("items", {
                    "item_code": items[j % len(items)],
                    "qty": 50 + (j * 25),
                    "rate": 850 + (j * 50),
                    "delivery_date": add_days(today(), 7),
                    "warehouse": set_wh,
                })
                so.insert(ignore_permissions=True)
                so.submit()
                print(f"  ✅ Created SO: {so.name} ({company} → {customer})")
            except Exception as e:
                print(f"  ⚠️  SO failed for {company}: {str(e)[:80]}")

        # Create 1 Delivery Note per company
        try:
            dn = frappe.new_doc("Delivery Note")
            dn.customer = customers[i * 2]
            dn.company = company
            dn.set_warehouse = set_wh
            dn.posting_date = today()
            dn.append("items", {
                "item_code": items[0],
                "qty": 20,
                "rate": 850,
                "warehouse": set_wh,
            })
            dn.insert(ignore_permissions=True)
            dn.submit()
            print(f"  ✅ Created DN: {dn.name} ({company})")
        except Exception as e:
            print(f"  ⚠️  DN failed for {company}: {str(e)[:80]}")

        # Create 1 Sales Invoice per company
        try:
            si = frappe.new_doc("Sales Invoice")
            si.customer = customers[i * 2]
            si.company = company
            si.set_warehouse = set_wh
            si.posting_date = today()
            si.append("items", {
                "item_code": items[1],
                "qty": 15,
                "rate": 900,
                "warehouse": set_wh,
            })
            si.insert(ignore_permissions=True)
            si.submit()
            print(f"  ✅ Created SI: {si.name} ({company})")
        except Exception as e:
            print(f"  ⚠️  SI failed for {company}: {str(e)[:80]}")


def create_procurement_data():
    companies = ["Geeta Enterprise", "Global Export", "Shubham Enterprise"]
    suppliers = ["IOCL Distributor", "BPCL Dealer", "HPCL Supplier"]
    items = ["IOCL-HP-15W40", "IOCL-XP-10W30", "IOCL-Ultra-10W40"]
    wh_map = {"Geeta Enterprise": "Available WH - GE", "Global Export": "Available WH - GEX", "Shubham Enterprise": "Available WH - SHE"}

    for i, company in enumerate(companies):
        set_wh = wh_map.get(company, "")
        # Create 2 Purchase Orders per company
        for j in range(2):
            supplier = suppliers[(i * 2 + j) % len(suppliers)]
            try:
                po = frappe.new_doc("Purchase Order")
                po.supplier = supplier
                po.company = company
                po.set_warehouse = set_wh
                po.transaction_date = today()
                po.schedule_date = add_days(today(), 5)
                po.append("items", {
                    "item_code": items[j % len(items)],
                    "qty": 100 + (j * 50),
                    "rate": 750 + (j * 30),
                    "schedule_date": add_days(today(), 5),
                    "warehouse": set_wh,
                })
                po.insert(ignore_permissions=True)
                po.submit()
                print(f"  ✅ Created PO: {po.name} ({company} ← {supplier})")
            except Exception as e:
                print(f"  ⚠️  PO failed for {company}: {str(e)[:80]}")

        # Create 1 Purchase Receipt per company
        try:
            pr = frappe.new_doc("Purchase Receipt")
            pr.supplier = suppliers[i]
            pr.company = company
            pr.set_warehouse = set_wh
            pr.posting_date = today()
            pr.append("items", {
                "item_code": items[0],
                "qty": 30,
                "rate": 750,
                "warehouse": set_wh,
            })
            pr.insert(ignore_permissions=True)
            pr.submit()
            print(f"  ✅ Created PR: {pr.name} ({company})")
        except Exception as e:
            print(f"  ⚠️  PR failed for {company}: {str(e)[:80]}")

        # Create 1 Purchase Invoice per company
        try:
            pi = frappe.new_doc("Purchase Invoice")
            pi.supplier = suppliers[i]
            pi.company = company
            pi.set_warehouse = set_wh
            pi.posting_date = today()
            pi.append("items", {
                "item_code": items[2],
                "qty": 25,
                "rate": 800,
                "warehouse": set_wh,
            })
            pi.insert(ignore_permissions=True)
            pi.submit()
            print(f"  ✅ Created PI: {pi.name} ({company})")
        except Exception as e:
            print(f"  ⚠️  PI failed for {company}: {str(e)[:80]}")


def create_intercompany_transfers():
    transfers = [
        {"from": "Geeta Enterprise", "to": "Global Export", "item": "IOCL-HP-15W40", "qty": 40, "from_wh": "Available WH - GE", "to_wh": "Available WH - GEX"},
        {"from": "Global Export", "to": "Shubham Enterprise", "item": "IOCL-XP-10W30", "qty": 30, "from_wh": "Available WH - GEX", "to_wh": "Available WH - SHE"},
        {"from": "Shubham Enterprise", "to": "Geeta Enterprise", "item": "IOCL-Ultra-10W40", "qty": 25, "from_wh": "Available WH - SHE", "to_wh": "Available WH - GE"},
    ]
    
    for t in transfers:
        try:
            ict = frappe.new_doc("Inter Company Transfer")
            ict.company = t["from"]
            ict.to_company = t["to"]
            ict.transaction_type = "Inter Company Stock Transfer"
            ict.posting_date = today()
            ict.append("items", {
                "item_code": t["item"],
                "qty": t["qty"],
                "rate": 800,
                "source_warehouse": t["from_wh"],
                "target_warehouse": t["to_wh"],
            })
            ict.insert(ignore_permissions=True)
            ict.submit()
            print(f"  ✅ Created ICT: {ict.name} ({t['from']} → {t['to']})")
        except Exception as e:
            print(f"  ⚠️  ICT failed: {str(e)[:100]}")
