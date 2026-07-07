import frappe

def execute():
    frappe.form_dict['company'] = 'Geeta Enterprise'
    frappe.form_dict['item'] = 'IOCL-Ultra-10W40'
    from oil_distribution.oil_distribution.page.oil_command_center.oil_command_center import get_kpis
    r1 = get_kpis()
    print('GE + IOCL-Ultra-10W40:', r1)

    frappe.form_dict['company'] = 'All'
    frappe.form_dict['item'] = 'IOCL-Ultra-10W40'
    r2 = get_kpis()
    print('All + IOCL-Ultra-10W40:', r2)

    frappe.form_dict['company'] = 'All'
    frappe.form_dict['item'] = 'All'
    r3 = get_kpis()
    print('All + All:', r3)

    frappe.form_dict['company'] = 'Geeta Enterprise'
    frappe.form_dict['item'] = 'All'
    r4 = get_kpis()
    print('GE + All Items:', r4)
