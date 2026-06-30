import frappe

def execute():
    # Check if JS is in DB
    r = frappe.db.sql("""
        SELECT name, is_standard, javascript 
        FROM tabReport 
        WHERE name = 'IOCL Procurement Report'
    """, as_dict=True)
    print("DB record:", r)
    
    # Check if frappe.query_reports has it registered
    has_key = 'IOCL Procurement Report' in frappe.query_reports
    print("Registered in frappe.query_reports:", has_key)
    
    # Try to load JS manually
    report = frappe.get_doc('Report', 'IOCL Procurement Report')
    print("Report.is_standard:", report.is_standard)
    print("Has javascript:", bool(report.javascript))
    if report.javascript:
        print("JS length:", len(report.javascript))
        print("JS first 200:", report.javascript[:200])
    
    return "done"
