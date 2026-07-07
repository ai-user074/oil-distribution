import frappe
frappe.form_dict['company'] = 'Geeta Enterprise'
frappe.form_dict['item'] = 'IOCL-Ultra-10W40'
from oil_distribution.oil_distribution.page.oil_command_center.oil_command_center import get_kpis
result = get_kpis()
print('KPIs for GE + IOCL-Ultra-10W40:', result)

frappe.form_dict['company'] = 'All'
frappe.form_dict['item'] = 'IOCL-Ultra-10W40'
result2 = get_kpis()
print('KPIs for All + IOCL-Ultra-10W40:', result2)

frappe.form_dict['company'] = 'All'
frappe.form_dict['item'] = 'All'
result3 = get_kpis()
print('KPIs for All + All:', result3)
