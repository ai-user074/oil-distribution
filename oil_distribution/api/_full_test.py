import frappe

def execute():
    print('Workspace: OK')
    print(f'Sidebar: OK')
    
    # Test ICT
    ict = frappe.new_doc('Inter Company Transfer')
    ict.company = 'Geeta Enterprise'
    ict.to_company = 'Global Export'
    ict.transaction_type = 'Inter Company Stock Transfer'
    ict.posting_date = frappe.utils.today()
    ict.append('items', {
        'item_code': 'ENGINE-10W30',
        'qty': 10,
        'rate': 450,
        'source_warehouse': 'Available WH - GE',
        'target_warehouse': 'Available WH - GEX',
    })
    ict.insert(ignore_permissions=True)
    ict.submit()
    frappe.db.commit()
    ict.reload()
    docs = frappe.get_all('Inter Company Transfer Generated Document',
        filters={'parent': ict.name}, fields=['document_type', 'document_name'])
    print(f'ICT {ict.name}: {ict.status} - {len(docs)} docs created')
    for d in docs:
        print(f'  {d.document_type}: {d.document_name}')
