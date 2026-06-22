import frappe


def execute():
    # Create custom roles
    for role_name in ["Intercompany Manager", "Reservation Manager", "Stock Reservation User"]:
        if not frappe.db.exists("Role", role_name):
            frappe.get_doc({
                "doctype": "Role",
                "role_name": role_name,
                "desk_access": 1
            }).insert(ignore_permissions=True)
