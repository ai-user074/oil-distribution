import frappe


def execute():
    """Setup desktop icon and workspace sidebar for Oil Distribution."""

    # Create Desktop Icon
    if not frappe.db.exists("Desktop Icon", "Oil Distribution"):
        doc = frappe.get_doc(
            {
                "doctype": "Desktop Icon",
                "name": "Oil Distribution",
                "label": "Oil Distribution",
                "app": "oil_distribution",
                "icon_type": "App",
                "link": "/app/oil-operations",
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

    # Create Workspace Sidebar
    if not frappe.db.exists("Workspace Sidebar", "Oil Operations"):
        sidebar = frappe.get_doc(
            {
                "doctype": "Workspace Sidebar",
                "name": "Oil Operations",
                "title": "Oil Operations",
                "app": "oil_distribution",
                "module": "Intercompany Operations",
                "header_icon": "cubes",
                "standard": 1,
                "idx": 0,
                "items": [
                    {
                        "type": "Link",
                        "label": "Oil Operations",
                        "link_to": "Oil Operations",
                        "link_type": "Workspace",
                        "icon": "home",
                        "indent": 0,
                        "child": 0,
                        "collapsible": 1,
                        "keep_closed": 0,
                        "show_arrow": 0,
                    },
                    {
                        "type": "Link",
                        "label": "Inter Company Transfer",
                        "link_to": "Inter Company Transfer",
                        "link_type": "DocType",
                        "icon": "arrow-right-arrow-left",
                        "indent": 0,
                        "child": 0,
                        "collapsible": 1,
                        "keep_closed": 0,
                        "show_arrow": 0,
                    },
                    {
                        "type": "Link",
                        "label": "Stock Reservation",
                        "link_to": "Stock Reservation",
                        "link_type": "DocType",
                        "icon": "bookmark",
                        "indent": 0,
                        "child": 0,
                        "collapsible": 1,
                        "keep_closed": 0,
                        "show_arrow": 0,
                    },
                    {
                        "type": "Link",
                        "label": "Stock Entry",
                        "link_to": "Stock Entry",
                        "link_type": "DocType",
                        "icon": "stock",
                        "indent": 0,
                        "child": 0,
                        "collapsible": 1,
                        "keep_closed": 0,
                        "show_arrow": 0,
                    },
                    {
                        "type": "Section Break",
                        "label": "Reports",
                        "icon": "tool",
                        "indent": 1,
                        "child": 0,
                        "collapsible": 1,
                        "keep_closed": 1,
                        "show_arrow": 0,
                        "link_type": "DocType",
                    },
                    {
                        "type": "Link",
                        "label": "IOCL Procurement Report",
                        "link_to": "IOCL Procurement Report",
                        "link_type": "Report",
                        "indent": 0,
                        "child": 1,
                        "collapsible": 1,
                        "keep_closed": 0,
                        "show_arrow": 0,
                    },
                    {
                        "type": "Link",
                        "label": "Negative Stock Report",
                        "link_to": "Negative Stock Report",
                        "link_type": "Report",
                        "indent": 0,
                        "child": 1,
                        "collapsible": 1,
                        "keep_closed": 0,
                        "show_arrow": 0,
                    },
                    {
                        "type": "Link",
                        "label": "Available Vs Reserved",
                        "link_to": "Available Vs Reserved",
                        "link_type": "Report",
                        "indent": 0,
                        "child": 1,
                        "collapsible": 1,
                        "keep_closed": 0,
                        "show_arrow": 0,
                    },
                    {
                        "type": "Link",
                        "label": "Intercompany Transfer Report",
                        "link_to": "Intercompany Transfer Report",
                        "link_type": "Report",
                        "indent": 0,
                        "child": 1,
                        "collapsible": 1,
                        "keep_closed": 0,
                        "show_arrow": 0,
                    },
                    {
                        "type": "Link",
                        "label": "Company Wise Stock",
                        "link_to": "Company Wise Stock",
                        "link_type": "Report",
                        "indent": 0,
                        "child": 1,
                        "collapsible": 1,
                        "keep_closed": 0,
                        "show_arrow": 0,
                    },
                    {
                        "type": "Link",
                        "label": "Reserved Stock",
                        "link_to": "Reserved Stock",
                        "link_type": "Report",
                        "indent": 0,
                        "child": 1,
                        "collapsible": 1,
                        "keep_closed": 0,
                        "show_arrow": 0,
                    },
                    {
                        "type": "Section Break",
                        "label": "Settings",
                        "icon": "settings",
                        "indent": 1,
                        "child": 0,
                        "collapsible": 1,
                        "keep_closed": 1,
                        "show_arrow": 0,
                        "link_type": "DocType",
                    },
                    {
                        "type": "Link",
                        "label": "Transfer Settings",
                        "link_to": "Transfer Settings",
                        "link_type": "DocType",
                        "indent": 0,
                        "child": 1,
                        "collapsible": 1,
                        "keep_closed": 0,
                        "show_arrow": 0,
                    },
                ],
            }
        )
        sidebar.insert(ignore_permissions=True, ignore_if_duplicate=True)
        print("Workspace Sidebar created")
    else:
        frappe.db.set_value(
            "Workspace Sidebar", "Oil Operations", {"standard": 1, "app": "oil_distribution"}
        )
        print("Workspace Sidebar updated")

    frappe.db.commit()
    print("Done!")
