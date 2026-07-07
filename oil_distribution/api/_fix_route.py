import frappe

def execute():
    # Fix desktop icon link in DB
    frappe.db.sql("UPDATE `tabDesktop Icon` SET link='/app/oil-distribution' WHERE name='Oil Distribution'")
    frappe.db.commit()
    print("Fixed Desktop Icon link to /app/oil-distribution")
    
    # Verify
    icon = frappe.db.get_value("Desktop Icon", "Oil Distribution", ["name", "link"], as_dict=True)
    print(f"Desktop Icon: {icon}")
