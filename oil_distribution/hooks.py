app_name = "oil_distribution"
app_title = "Oil Distribution"
app_publisher = "Geeta Enterprise"
app_description = "Intercompany transfers and Swastik reservations for ERPNext"
app_icon = "fa fa-cubes"
app_email = "dev@geeta.in"
app_license = "MIT"
source_link = "https://github.com/ai-user074/oil_distribution"
app_logo_url = "/assets/oil_distribution/images/oil_distribution-logo.svg"
app_home = "/app/oil-operations"

develop_version = "0.0.1"

add_to_apps_screen = [
	{
		"name": app_name,
		"logo": app_logo_url,
		"title": app_title,
		"route": app_home,
		"has_permission": None,
	}
]

fixtures = [
    {"dt": "Role", "filters": [["name", "in",
        ["Intercompany Manager", "Reservation Manager", "Stock Reservation User"]]]},
]

doc_events = {
    "Stock Entry": {
        "on_submit": "oil_distribution.api.stock_events.handle_stock_entry_submit",
        "on_cancel": "oil_distribution.api.stock_events.handle_stock_entry_cancel",
    }
}

scheduler_events = {
    "daily": [
        "oil_distribution.api.reports.daily_negative_stock_report"
    ],
    "cron": {
        "0 8 * * *": [
            "oil_distribution.api.reports.email_reserved_stock_report"
        ]
    }
}
