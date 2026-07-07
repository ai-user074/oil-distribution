frappe.query_reports["Intercompany Transfer Report"] = {
	"filters": [
		{
			"fieldname": "from_company",
			"label": "From Company",
			"fieldtype": "Link",
			"options": "Company",
		},
		{
			"fieldname": "to_company",
			"label": "To Company",
			"fieldtype": "Link",
			"options": "Company",
		},
		{
			"fieldname": "posting_date",
			"label": "Posting Date",
			"fieldtype": "DateRange",
		},
	]
};
