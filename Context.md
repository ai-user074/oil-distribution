# Oil Distribution App - Context & Reference

## Project Overview
Custom Frappe 16 + ERPNext 16 app for engine oil distribution with intercompany transfers, stock reservations, reports, and India compliance across 3 companies.

---

## Environment
- **Frappe Framework**: v16.23.0
- **ERPNext**: v16.23.1
- **HRMS**: v16.10.0
- **India Compliance**: v16.6.1
- **Site**: `dev.localhost`
- **Ports**: socketio_port = 0, webserver_port = 8000
- **Procfile**: socketio commented out (Codespaces compatible)

---

## Companies
| Company | Abbr | Default Currency | Country |
|---------|------|------------------|---------|
| Geeta Enterprise | GE | INR | India |
| Global Export | GEX | INR | India |
| Shubham Enterprise | SHE | INR | India |

---

## Items (Engine Oils Only)
| Item Code | Description |
|-----------|-------------|
| ENGINE-10W30 | Engine Oil 10W30 |
| ENGINE-15W40 | Engine Oil 15W40 |
| ENGINE-20W50 | Engine Oil 20W50 |
| ENGINE-5W30 | Engine Oil 5W30 |

---

## Warehouses (Per Company)
Each company has 7 warehouses:
- `Available WH - {abbr}` (Main warehouse for available stock)
- `Reserved WH - {abbr}` (Main warehouse for reserved stock)
- `Stores - {abbr}`
- `Raw Material Warehouse - {abbr}`
- `Finished Goods - {abbr}`
- `Transit Warehouse - {abbr}`
- `Work In Progress Warehouse - {abbr}`

Plus standard ERPNext warehouses for each company.

---

## Custom DocTypes

### Inter Company Transfer (ICT)
- **Module**: Intercompany Operations
- **Status**: Submittable
- **Naming**: ICT.##### (auto-increment)
- **Features**:
  - Multi-item child table (Inter Company Transfer Item)
  - Generated Documents tracking (Dynamic Link)
  - Auto SO -> PO -> DN -> PR chain via ERPNext native APIs
  - Fields: batch_no, sales_tax_template, purchase_tax_template
  - Source warehouse filtered by source company
  - Target warehouse filtered by target company
  - Amount auto-calculated from item rates

### Stock Reservation
- **Module**: Reservation Management
- **Status**: Submittable
- **Naming**: SR.##### (auto-increment)
- **Features**:
  - Material Transfer on submit/release
  - Reserved warehouse via naming convention: `Reserved WH - {company_abbr}`
  - `total_reserved_for_swastik` field (read-only): Shows grand total of ALL reserved quantities across ALL companies for ALL items
  - Warehouse filtering by company (warehouse + reserved_warehouse)
  - `reserved_for` options: Swastik, Sales Order, Purchase Order, Work Order, Internal, Other
  - Negative stock warning (orange, non-blocking)

### Transfer Settings
- **Module**: Intercompany Operations
- **Type**: Singleton
- **Fields**: notification_email, auto_create_intercompany_docs, inter_company_auto_mode, inter_company_default_series

---

## Custom Roles
- Intercompany Manager
- Reservation Manager
- Stock Reservation User

---

## Reports
All reports are `is_standard=No` with JS stored in DB `javascript` column.

| Report | Module | Description |
|--------|--------|-------------|
| IOCL Procurement | Dashboard Reports | Procurement analysis |
| Negative Stock | Dashboard Reports | Items with negative stock |
| Available Vs Reserved | Dashboard Reports | Stock comparison |
| Intercompany Transfer | Dashboard Reports | Transfer summary |
| Company Wise Stock | Dashboard Reports | Stock by company & warehouse |
| Reserved Stock | Dashboard Reports | Reservation details |

---

## Stock Dashboard
- **Page Name**: `stock-dashboard` (hyphenated, Frappe 16 convention)
- **Location**: `intercompany_operations/page/stock_dashboard/`
- **Features**:
  - View stock by company & warehouse (tabbed UI)
  - View stock by item (drill-down from item to warehouse)
  - Real-time data from Stock Ledger Entry
  - Standard Frappe light styling (no gradients)
- **Page JSON**: `script: null` (Frappe loads JS from filesystem)

---

## App Structure
```
oil_distribution/
├── __init__.py                    # __version__ = "0.0.1"
├── hooks.py                       # Root hooks
├── modules.txt                    # 3 modules
├── patches.txt                    # pre/post model sync
├── api/
│   ├── __init__.py
│   ├── stock_events.py           # Stock Entry event handlers
│   ├── reports.py                # Scheduled email reports
│   ├── setup_icons.py            # Post-install icon/sidebar
│   ├── setup_master_data.py      # Engine oil items
│   ├── test_full.py              # 20-test E2E suite
│   ├── test_production.py        # 31-test production suite
│   └── test_bulk.py              # 51-test bulk suite
├── intercompany_operations/
│   ├── module_def.json
│   ├── doctype/
│   │   ├── inter_company_transfer/
│   │   │   ├── inter_company_transfer.json
│   │   │   ├── inter_company_transfer.py
│   │   │   ├── inter_company_transfer.js
│   │   │   └── inter_company_transfer_list.js
│   │   ├── inter_company_transfer_item/
│   │   │   └── inter_company_transfer_item.json
│   │   ├── inter_company_transfer_generated_document/
│   │   │   └── inter_company_transfer_generated_document.json
│   │   └── transfer_settings/
│   │       ├── transfer_settings.json
│   │       └── transfer_settings.py
│   ├── page/
│   │   └── stock_dashboard/
│   │       ├── stock_dashboard.json
│   │       ├── stock_dashboard.py
│   │       └── stock_dashboard.js
│   └── workspace/
│       └── oil_operations/
│           └── oil_operations.json
├── reservation_management/
│   ├── module_def.json
│   └── doctype/
│       └── stock_reservation/
│           ├── stock_reservation.json
│           ├── stock_reservation.py
│           └── stock_reservation.js
├── dashboard_reports/
│   ├── module_def.json
│   └── report/
│       ├── __init__.py
│       ├── iocl_procurement/
│       ├── negative_stock/
│       ├── available_vs_reserved/
│       ├── intercompany_transfer/
│       ├── company_wise_stock/
│       └── reserved_stock/
└── workspace_sidebar/
    └── oil_operations.json
```

---

## Key Technical Decisions

### Frappe 16 Specifics
1. **Page name**: Must be hyphenated (`stock-dashboard`) matching URL convention
2. **Page JS**: `script` field in Page JSON must be `null` — Frappe loads JS from filesystem via `load_assets()`
3. **Report JS**: For `is_standard=No` reports, reads from DB `javascript` column; for `is_standard=Yes`, reads from filesystem
4. **Page JS registration**: `frappe.pages['stock-dashboard']` (hyphenated key)
5. **Frappe 16 defaults**: Use `frappe.defaults.get_default("key")` not `frappe.defaults.get_defaults()`
6. **Socket.io in Codespaces**: Set `socketio_port: 0` to avoid CORS issues

### ERPNext Intercompany APIs
- `make_inter_company_transaction` from `erpnext.selling.doctype.sales_order.sales_order`
- `make_delivery_note` from `erpnext.selling.doctype.sales_order.sales_order`
- `make_inter_company_purchase_receipt` from `erpnext.stock.doctype.delivery_note.delivery_note`

### Controller Logic
- **ICT**: SO must be submitted before `make_delivery_note()`, PO items need `warehouse` set, `purpose` must be set explicitly alongside `stock_entry_type`
- **Stock Reservation**: `validate_warehouse()` in Stock Entry runs BEFORE `set_purpose_for_stock_entry()`, SE `purpose` must be set explicitly

### Design Principles
- Never modify ERPNext core files
- Controller-based logic (not separate API files)
- ERPNext native intercompany APIs for proper linking
- Negative stock: orange warning (non-blocking)
- Warehouse naming convention for reserved warehouses
- Generated Document child table uses Dynamic Link
- `db_set()` not `self.save()` for status updates on submitted docs
- Inter-company Customers/Suppliers need `companies` child table entries
- HSN codes must be 6+ digits for India Compliance

### Stock Tracking
- **Swastik is NOT a company** — it's a tracking concept
- `total_reserved_for_swastik` field shows grand total across ALL companies
- `get_swastik_total_reserved()` sums ALL submitted Stock Reservations (status=Reserved) across all companies/items

---

## Site Config
```json
{
  "installed_apps": ["frappe", "erpnext", "hrms", "india_compliance", "oil_distribution"]
}
```

---

## Useful Commands
```bash
# Build assets
bench build --app oil_distribution

# Force import sidebar
bench --site dev.localhost execute "frappe.client.import_file_by_path('/workspace/frappe-bench/apps/oil_distribution/oil_distribution/workspace_sidebar/oil_operations.json', force=True)"

# Run report test
bench --site dev.localhost execute "frappe.get_all('Report', filters={'module': 'Dashboard Reports'}, fields=['name', 'is_standard', 'report_type'])"

# Check stock
bench --site dev.localhost execute "frappe.get_all('Stock Ledger Entry', fields=['item_code', 'warehouse', 'actual_qty'], limit=10)"

# Check companies
bench --site dev.localhost execute "frappe.get_all('Company', fields=['name', 'abbr'])"
```

---

## Known Issues & Fixes
1. **Black screen in Codespaces**: Caused by socket.io CORS; fixed by `socketio_port: 0`
2. **Reports not loading**: Missing `__init__.py` in `dashboard_reports/report/`; created it
3. **Report JS errors**: Removed `get_query` patterns from filter definitions
4. **Workspace links broken**: Updated `link_to` to match hyphenated page name
5. **Sidebar not syncing**: Used `import_file_by_path` with `force=True`
6. **`frappe.model.Document` error**: Changed to `frappe.model.document.Document`
7. **Missing `__init__.py` in `api/`**: Created for proper module discovery
8. **Invalid sidebar icon**: Changed `"stock"` to `"box"` (valid Font Awesome)
9. **`bench migrate` orphan cleanup**: Ensured workspace JSON files exist and are synced after migrate
10. **Inline `bench execute` fails**: Must use script files for multi-line Python

---

## GitHub
- **Repo**: https://github.com/ai-user074/oil-distribution
- **Branch**: `v1`
- **Publisher**: Geeta Enterprise

---

## Future Enhancements (Not Implemented)
- User Permissions configuration (pending user hires)
- Batch-wise stock reservation flow testing
- Re-adding warehouse-company dependency in report filters
- Scheduled stock sync
- Dashboard email reports (infrastructure created)
- Barcode printing for items
