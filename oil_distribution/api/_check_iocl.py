import frappe

def execute():
    # Check report record in DB
    report = frappe.get_all('Report', filters={'name': 'IOCL Procurement Report'}, 
        fields=['name', 'is_standard', 'report_type', 'ref_doctype', 'javascript'])
    print("Report record:", report)
    
    # Check if JS is registered
    has_js = bool(report and report[0].get('javascript'))
    print("Has JS in DB:", has_js)
    
    # Direct query test
    data = frappe.db.sql("""
        select po.name, po.supplier, po.company, po.transaction_date, po.status, po.grand_total
        from `tabPurchase Order` po
        where po.docstatus = 1 
        and po.company = 'Geeta Enterprise' 
        and po.supplier = 'IOCL'
        and po.transaction_date >= '2026-06-01'
        and po.transaction_date <= '2026-07-31'
        order by po.transaction_date desc
    """, as_dict=True)
    print("Direct query result:", data)
    
    # Check PO items for qty vs received_qty
    items = frappe.db.sql("""
        select poi.parent, poi.item_code, poi.qty, poi.received_qty, poi.stock_qty
        from `tabPurchase Order Item` poi
        join `tabPurchase Order` po on po.name = poi.parent
        where po.supplier = 'IOCL' and po.docstatus = 1
    """, as_dict=True)
    print("PO items:", items)
    
    # Check Purchase Receipts for IOCL
    pr_data = frappe.db.sql("""
        select pr.name, pr.supplier, pr.company, pr.docstatus, pr.posting_date
        from `tabPurchase Receipt` pr
        where pr.supplier = 'IOCL' and pr.docstatus = 1
    """, as_dict=True)
    print("IOCL PRs:", pr_data)
    
    return "done"
