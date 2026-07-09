import frappe, random
from frappe.utils import getdate, add_days, nowdate

COMPANIES = {'Geeta Enterprise': 'GE', 'Global Export': 'GEX', 'Shubham Enterprise': 'SHE'}
ITEMS = ['4SE-OIL', 'ENGINE-5W30', 'ENGINE-20W50', 'ENGINE-10W30', 'IOCL-Ultra-10W40', 'IOCL-XP-10W30', 'IOCL-HP-15W40']
BUYING = {'4SE-OIL': 300, 'ENGINE-5W30': 160, 'ENGINE-20W50': 130, 'ENGINE-10W30': 150, 'IOCL-Ultra-10W40': 800, 'IOCL-XP-10W30': 780, 'IOCL-HP-15W40': 750}
SELLING = {'4SE-OIL': 400, 'ENGINE-5W30': 220, 'ENGINE-20W50': 180, 'ENGINE-10W30': 200, 'IOCL-Ultra-10W40': 800, 'IOCL-XP-10W30': 900, 'IOCL-HP-15W40': 850}
CUSTOMERS = ['Hero MotoCorp', 'Mahindra & Mahindra', 'Bajaj Auto', 'Tata Motors', 'Reliance Industries', 'Imran Petrol pump', 'Palmer Productions Ltd.', 'West View Software Ltd.', 'Grant Plastics Ltd.']
SUPPLIERS = ['IOCL', 'IOCL Distributor', 'BPCL Dealer', 'HPCL Supplier', 'Zuckerman Security Ltd.', 'MA Inc.', 'Summit Traders Ltd.']

random.seed(42)

def rd(s, e):
    ss, ee = getdate(s), getdate(e)
    days = (ee - ss).days
    return str(add_days(ss, random.randint(0, max(0, days))))

def months_iter():
    for y in [2025, 2026]:
        for m in range(1, 13 if y == 2025 else 8):
            ms = f'{y}-{m:02d}-01'
            me = f'{y+1 if m==12 else y}-{1 if m==12 else m+1:02d}-01'
            end = str(add_days(getdate(me), -1))
            yield y, m, ms, end

@frappe.whitelist()
def seed_all():
    print(f'Creating data for 19 months (Jan 2025 - Jul 2026)', flush=True)

    # 1. Stock
    print('\n1. Ensuring stock...', flush=True)
    for co, ab in COMPANIES.items():
        for item in ITEMS:
            wh = f'Available WH - {ab}'
            existing = frappe.db.get_value('Bin', {'item_code': item, 'warehouse': wh}, 'actual_qty') or 0
            if existing < 200:
                needed = 500 - existing
                if needed > 0:
                    se = frappe.get_doc({
                        'doctype': 'Stock Entry',
                        'stock_entry_type': 'Material Receipt',
                        'company': co,
                        'set_posting_time': 1,
                        'posting_date': '2025-04-01',
                        'items': [{'item_code': item, 'qty': needed, 't_warehouse': wh, 'basic_rate': BUYING[item]}]
                    })
                    se.insert(ignore_permissions=True).submit()
                    print(f'  Stocked {needed} x {item} -> Available WH - {ab}', flush=True)

    # 2. Sales Invoices
    print('\n2. Creating Sales Invoices...', flush=True)
    si_count = 0
    for y, m, ms, end in months_iter():
        for co, ab in COMPANIES.items():
            item = random.choice(ITEMS)
            dt = rd(ms, end)
            si = frappe.get_doc({
                'doctype': 'Sales Invoice',
                'company': co,
                'customer': random.choice(CUSTOMERS),
                'posting_date': dt,
                'set_posting_time': 1,
                'due_date': str(add_days(getdate(dt), 30)),
                'items': [{
                    'item_code': item, 'qty': random.randint(20, 120), 'rate': SELLING[item],
                    'warehouse': f'Available WH - {ab}', 'income_account': f'Sales - {ab}', 'cost_center': f'Main - {ab}'
                }],
                'taxes': [{'charge_type': 'On Net Total', 'account_head': f'Output Tax IGST - {ab}', 'rate': 18.0, 'description': 'IGST 18%'}]
            })
            si.insert(ignore_permissions=True).submit()
            si_count += 1
            if si_count % 10 == 0:
                print(f'  {si_count} SIs...', flush=True)
    print(f'  Total: {si_count} Sales Invoices', flush=True)

    # 3. Purchase Invoices
    print('\n3. Creating Purchase Invoices...', flush=True)
    pi_count = 0
    for y, m, ms, end in months_iter():
        for co, ab in COMPANIES.items():
            item = random.choice(ITEMS)
            dt = rd(ms, end)
            pi = frappe.get_doc({
                'doctype': 'Purchase Invoice',
                'company': co,
                'supplier': random.choice(SUPPLIERS),
                'posting_date': dt,
                'set_posting_time': 1,
                'due_date': str(add_days(getdate(dt), 30)),
                'items': [{
                    'item_code': item, 'qty': random.randint(30, 150), 'rate': BUYING[item],
                    'warehouse': f'Available WH - {ab}', 'expense_account': f'Cost of Goods Sold - {ab}', 'cost_center': f'Main - {ab}'
                }],
                'taxes': [{'charge_type': 'On Net Total', 'account_head': f'Input Tax IGST - {ab}', 'rate': 18.0, 'description': 'IGST 18%'}]
            })
            pi.insert(ignore_permissions=True).submit()
            pi_count += 1
            if pi_count % 10 == 0:
                print(f'  {pi_count} PIs...', flush=True)
    print(f'  Total: {pi_count} Purchase Invoices', flush=True)

    # 4. ICTs
    print('\n4. Creating Inter Company Transfers...', flush=True)
    ict_count = 0
    cos = list(COMPANIES.keys())
    for y, m, ms, end in months_iter():
        for _ in range(2):
            fc = random.choice(cos)
            tc = random.choice([c for c in cos if c != fc])
            item = random.choice(ITEMS)
            dt = min(rd(ms, end), nowdate())
            from_abb = COMPANIES[fc]
            to_abb = COMPANIES[tc]
            ict = frappe.get_doc({
                'doctype': 'Inter Company Transfer',
                'company': fc,
                'to_company': tc,
                'posting_date': dt,
                'set_posting_time': 1,
                'items': [{
                    'item_code': item,
                    'qty': random.randint(15, 80),
                    'rate': BUYING[item] + 20,
                    'source_warehouse': f'Available WH - {from_abb}',
                    'target_warehouse': f'Available WH - {to_abb}'
                }]
            })
            ict.insert(ignore_permissions=True).submit()
            ict_count += 1
    print(f'  Total: {ict_count} Inter Company Transfers', flush=True)

    # 5. SRs
    print('\n5. Creating Stock Reservations...', flush=True)
    sr_count = 0
    for co, ab in COMPANIES.items():
        for item in ITEMS:
            sr = frappe.get_doc({
                'doctype': 'Stock Reservation',
                'company': co,
                'item': item,
                'warehouse': f'Reserved WH - {ab}',
                'reserved_qty': random.randint(30, 200),
                'status': 'Reserved'
            })
            sr.insert(ignore_permissions=True).submit()
            sr_count += 1
    print(f'  Total: {sr_count} Stock Reservations', flush=True)

    frappe.db.commit()
    print('\nDONE! All data seeded successfully.', flush=True)

@frappe.whitelist()
def seed_more():
    """Add more negative stock, ICTs, and reservations on top of existing data."""
    print('Seeding additional data...', flush=True)

    cos = list(COMPANIES.keys())

    # 1. More reservations
    print('\n1. Creating More Stock Reservations...', flush=True)
    sr_count = 0
    for _ in range(30):
        co = random.choice(cos)
        ab = COMPANIES[co]
        item = random.choice(ITEMS)
        sr = frappe.get_doc({
            'doctype': 'Stock Reservation',
            'company': co,
            'item': item,
            'warehouse': f'Reserved WH - {ab}',
            'reserved_qty': random.randint(50, 500),
            'status': 'Reserved'
        })
        sr.insert(ignore_permissions=True).submit()
        sr_count += 1
    print(f'  Created {sr_count} Reservations', flush=True)
    frappe.db.commit()

    # 2. Negative Stock (Material Issue exceeding available)
    print('\n2. Creating Negative Stock...', flush=True)
    neg_count = 0
    for co, ab in COMPANIES.items():
        av_wh = f'Available WH - {ab}'
        for item in ITEMS:
            avail = frappe.db.get_value('Bin', {'item_code': item, 'warehouse': av_wh}, 'actual_qty') or 0
            if avail > 100:
                over = int(avail * random.uniform(1.2, 1.5))
                dt = rd('2025-06-01', '2026-06-01')
                se = frappe.get_doc({
                    'doctype': 'Stock Entry',
                    'stock_entry_type': 'Material Issue',
                    'company': co,
                    'set_posting_time': 1,
                    'posting_date': min(dt, nowdate()),
                    'items': [{
                        'item_code': item, 'qty': over, 's_warehouse': av_wh,
                        'basic_rate': BUYING[item]
                    }]
                })
                se.insert(ignore_permissions=True).submit()
                neg_count += 1
                print(f'  Issued {over} x {item} (avail {avail}) -> neg={avail - over}', flush=True)
    print(f'  Total: {neg_count} Negative Stock entries', flush=True)
    frappe.db.commit()

    # 3. More ICTs (3 per month = 57 additional)
    print('\n3. Creating Additional Inter Company Transfers...', flush=True)
    ict_count = 0
    for y, m, ms, end in months_iter():
        for _ in range(3):
            fc = random.choice(cos)
            tc = random.choice([c for c in cos if c != fc])
            num_items = random.randint(1, 3)
            chosen = random.sample(ITEMS, num_items)
            items_list = []
            for item in chosen:
                items_list.append({
                    'item_code': item,
                    'qty': random.randint(20, 120),
                    'rate': BUYING[item] + 20,
                    'source_warehouse': f'Available WH - {COMPANIES[fc]}',
                    'target_warehouse': f'Available WH - {COMPANIES[tc]}'
                })
            dt = min(rd(ms, end), nowdate())
            ict = frappe.get_doc({
                'doctype': 'Inter Company Transfer',
                'company': fc,
                'to_company': tc,
                'posting_date': dt,
                'set_posting_time': 1,
                'items': items_list
            })
            ict.insert(ignore_permissions=True).submit()
            ict_count += 1
    print(f'  Total: {ict_count} Additional ICTs', flush=True)

    frappe.db.commit()
    print('\nDONE! Additional data seeded.', flush=True)
