import frappe


def execute():
    """Setup desktop icon for Oil Distribution. Sidebar is managed via JSON file."""
    # Create Desktop Icon
    if not frappe.db.exists("Desktop Icon", "Oil Distribution"):
        doc = frappe.get_doc(
            {
                "doctype": "Desktop Icon",
                "name": "Oil Distribution",
                "label": "Oil Distribution",
                "app": "oil_distribution",
                "icon_type": "App",
                "link": "/app/oil-distribution",
                "link_type": "External",
                "logo_url": "/assets/oil_distribution/images/oil_distribution-logo.svg",
                "hidden": 0,
                "standard": 1,
                "roles": [],
            }
        )
        doc.insert(ignore_permissions=True, ignore_if_duplicate=True)
        print("Desktop Icon created")
    else:
        frappe.db.set_value(
            "Desktop Icon", "Oil Distribution", {"standard": 1, "app": "oil_distribution"}
        )
        print("Desktop Icon updated")

    frappe.db.commit()
    print("Done!")
