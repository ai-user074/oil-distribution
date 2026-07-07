import frappe
import json


def execute():
    """Create the Overall Dashboard with Number Cards, Charts, and Workspace."""
    
    create_number_cards()
    create_dashboard_charts()
    create_workspace()
    
    frappe.db.commit()
    print("\n✅ Overall Dashboard created successfully!")
    print("   - 4 Number Cards")
    print("   - 4 Dashboard Charts")
    print("   - 1 Workspace: Oil Distribution Command Center")


def create_number_cards():
    """Create 4 Number Cards for the dashboard."""
    cards = [
        {
            "name": "Total Sales Value",
            "label": "Total Sales Value",
            "document_type": "Sales Invoice",
            "function": "Sum",
            "aggregate_function_based_on": "base_grand_total",
            "filters_json": json.dumps([{"fieldname": "docstatus", "condition": "=", "value": "1", "hidden": 1}]),
            "color": "#5e64ce",
        },
        {
            "name": "Total Procurement Value",
            "label": "Total Procurement Value",
            "document_type": "Purchase Invoice",
            "function": "Sum",
            "aggregate_function_based_on": "base_grand_total",
            "filters_json": json.dumps([{"fieldname": "docstatus", "condition": "=", "value": "1", "hidden": 1}]),
            "color": "#ff6b6b",
        },
        {
            "name": "Swastik Reserved Qty",
            "label": "Swastik Reserved Qty",
            "document_type": "Stock Reservation",
            "function": "Sum",
            "aggregate_function_based_on": "quantity",
            "filters_json": json.dumps([
                {"fieldname": "docstatus", "condition": "=", "value": "1", "hidden": 1},
                {"fieldname": "status", "condition": "=", "value": "Reserved", "hidden": 1}
            ]),
            "color": "#ffab00",
        },
        {
            "name": "Total Available Qty",
            "label": "Total Available Qty",
            "document_type": "Stock Ledger Entry",
            "function": "Sum",
            "aggregate_function_based_on": "actual_qty",
            "filters_json": json.dumps([{"fieldname": "warehouse", "condition": "like", "value": "%Available%", "hidden": 1}]),
            "color": "#2ecc71",
        },
    ]
    
    for card_data in cards:
        name = card_data["name"]
        if frappe.db.exists("Number Card", name):
            frappe.delete_doc("Number Card", name, force=True)
        
        doc = frappe.new_doc("Number Card")
        doc.update(card_data)
        doc.is_standard = 1
        doc.module = "Oil Distribution"
        doc.show_percentage_stats = 1
        doc.stats_time_interval = "Monthly"
        doc.insert(ignore_permissions=True)
        print(f"  ✅ Created Number Card: {name}")


def create_dashboard_charts():
    """Create 4 Dashboard Charts for the dashboard."""
    charts = [
        {
            "chart_name": "Sales vs Procurement Trend",
            "chart_type": "Sum",
            "document_type": "Sales Invoice",
            "based_on": "posting_date",
            "value_based_on": "base_grand_total",
            "timeseries": 1,
            "timespan": "Last Year",
            "time_interval": "Monthly",
            "type": "Line",
            "filters_json": json.dumps([{"fieldname": "docstatus", "condition": "=", "value": "1", "hidden": 1}]),
            "color": "#5e64ce",
        },
        {
            "chart_name": "Company-wise Sales Distribution",
            "chart_type": "Group By",
            "document_type": "Sales Invoice",
            "group_by_based_on": "company",
            "value_based_on": "base_grand_total",
            "group_by_type": "Sum",
            "aggregate_function_based_on": "base_grand_total",
            "number_of_groups": 0,
            "timeseries": 0,
            "type": "Donut",
            "filters_json": json.dumps([{"fieldname": "docstatus", "condition": "=", "value": "1", "hidden": 1}]),
            "color": "#ff6b6b",
        },
        {
            "chart_name": "Top Customers by Sales",
            "chart_type": "Group By",
            "document_type": "Sales Invoice",
            "group_by_based_on": "customer",
            "value_based_on": "base_grand_total",
            "group_by_type": "Sum",
            "aggregate_function_based_on": "base_grand_total",
            "number_of_groups": 5,
            "timeseries": 0,
            "type": "Bar",
            "filters_json": json.dumps([{"fieldname": "docstatus", "condition": "=", "value": "1", "hidden": 1}]),
            "color": "#2ecc71",
        },
        {
            "chart_name": "Negative Stock Alerts",
            "chart_type": "Group By",
            "document_type": "Stock Ledger Entry",
            "group_by_based_on": "warehouse",
            "value_based_on": "actual_qty",
            "group_by_type": "Sum",
            "aggregate_function_based_on": "actual_qty",
            "number_of_groups": 0,
            "timeseries": 0,
            "type": "Bar",
            "filters_json": json.dumps([{"fieldname": "actual_qty", "condition": "<", "value": "0", "hidden": 1}]),
            "color": "#e74c3c",
        },
    ]
    
    for chart_data in charts:
        name = chart_data["chart_name"]
        if frappe.db.exists("Dashboard Chart", name):
            frappe.delete_doc("Dashboard Chart", name, force=True)
        
        doc = frappe.new_doc("Dashboard Chart")
        doc.update(chart_data)
        doc.is_standard = 1
        doc.module = "Oil Distribution"
        doc.is_public = 1
        doc.insert(ignore_permissions=True)
        print(f"  ✅ Created Dashboard Chart: {name}")


def create_workspace():
    """Create the Oil Distribution Command Center workspace."""
    workspace_name = "Oil Distribution Command Center"
    
    if frappe.db.exists("Workspace", workspace_name):
        frappe.delete_doc("Workspace", workspace_name, force=True)
    
    # Build workspace content JSON for Frappe 16
    content = [
        {
            "id": "header1",
            "type": "header",
            "data": {"text": "<span class='h4'><b>Oil Distribution Command Center</b></span>", "col": 12}
        },
        {
            "id": "card_kpi",
            "type": "card",
            "data": {"card_name": "Consolidated KPIs", "col": 12}
        },
        {
            "id": "card_sales_trend",
            "type": "card",
            "data": {"card_name": "Sales vs Procurement Trend", "col": 6}
        },
        {
            "id": "card_company_sales",
            "type": "card",
            "data": {"card_name": "Company-wise Distribution", "col": 6}
        },
        {
            "id": "card_top_customers",
            "type": "card",
            "data": {"card_name": "Top Customers", "col": 6}
        },
        {
            "id": "card_negative_stock",
            "type": "card",
            "data": {"card_name": "Negative Stock Alerts", "col": 6}
        },
        {
            "id": "card_links",
            "type": "card",
            "data": {"card_name": "Quick Actions", "col": 12}
        },
    ]
    
    links = [
        {
            "label": "Quick Actions",
            "type": "Card Break",
            "icon": "folder",
            "hidden": 0,
            "link_count": 0,
            "link_type": "DocType",
            "onboard": 0,
        },
        {
            "label": "Inter Company Transfer",
            "type": "Link",
            "link_to": "Inter Company Transfer",
            "link_type": "DocType",
            "hidden": 0,
            "link_count": 0,
            "onboard": 0,
        },
        {
            "label": "Stock Reservation",
            "type": "Link",
            "link_to": "Stock Reservation",
            "link_type": "DocType",
            "hidden": 0,
            "link_count": 0,
            "onboard": 0,
        },
        {
            "label": "Sales Invoice",
            "type": "Link",
            "link_to": "Sales Invoice",
            "link_type": "DocType",
            "hidden": 0,
            "link_count": 0,
            "onboard": 0,
        },
        {
            "label": "Purchase Invoice",
            "type": "Link",
            "link_to": "Purchase Invoice",
            "link_type": "DocType",
            "hidden": 0,
            "link_count": 0,
            "onboard": 0,
        },
        {
            "label": "Purchase Order",
            "type": "Link",
            "link_to": "Purchase Order",
            "link_type": "DocType",
            "hidden": 0,
            "link_count": 0,
            "onboard": 0,
        },
        {
            "label": "Stock Entry",
            "type": "Link",
            "link_to": "Stock Entry",
            "link_type": "DocType",
            "hidden": 0,
            "link_count": 0,
            "onboard": 0,
        },
        {
            "label": "Profit and Loss Statement",
            "type": "Link",
            "link_to": "Profit and Loss Statement",
            "link_type": "Report",
            "hidden": 0,
            "link_count": 0,
            "onboard": 0,
        },
    ]
    
    charts = [
        {
            "label": "Sales vs Procurement Trend",
            "chart_name": "Sales vs Procurement Trend",
        },
        {
            "label": "Company-wise Sales Distribution",
            "chart_name": "Company-wise Sales Distribution",
        },
        {
            "label": "Top Customers by Sales",
            "chart_name": "Top Customers by Sales",
        },
        {
            "label": "Negative Stock Alerts",
            "chart_name": "Negative Stock Alerts",
        },
    ]
    
    number_cards = [
        {
            "label": "Total Sales Value",
            "number_card_name": "Total Sales Value",
        },
        {
            "label": "Total Procurement Value",
            "number_card_name": "Total Procurement Value",
        },
        {
            "label": "Swastik Reserved Qty",
            "number_card_name": "Swastik Reserved Qty",
        },
        {
            "label": "Total Available Qty",
            "number_card_name": "Total Available Qty",
        },
    ]
    
    ws = frappe.new_doc("Workspace")
    ws.update({
        "label": workspace_name,
        "title": workspace_name,
        "icon": "dashboard",
        "module": "Oil Distribution",
        "is_default": 0,
        "is_hidden": 0,
        "standard": "Yes",
        "content": json.dumps(content),
    })
    
    for link in links:
        ws.append("links", link)
    
    for chart in charts:
        ws.append("charts", chart)
    
    for card in number_cards:
        ws.append("number_cards", card)
    
    ws.insert(ignore_permissions=True)
    print(f"  ✅ Created Workspace: {workspace_name}")
