import frappe
from frappe.utils import flt, nowdate, add_days, today
import time

PASS = 0
FAIL = 0
ERRORS = []
COMPANIES = ["Geeta Enterprise", "Global Export", "Shubham Enterprise"]
COMPANY_ABBRS = {c: frappe.get_cached_value("Company", c, "abbr") for c in COMPANIES}
ITEMS = ["ENGINE-10W30", "ENGINE-15W40", "ENGINE-20W50", "ENGINE-5W30"]


def run_test(name, fn):
    global PASS, FAIL, ERRORS
    try:
        result = fn()
        if result is False:
            FAIL += 1
            ERRORS.append(f"  FAIL: {name}")
            print(f"  FAIL: {name}")
        else:
            PASS += 1
            print(f"  OK {name}")
    except Exception as e:
        FAIL += 1
        ERRORS.append(f"  FAIL: {name}: {e}")
        print(f"  !! {name}: ERROR: {e}")


def wh(company, wh_type="Available"):
    abbr = COMPANY_ABBRS[company]
    return f"{wh_type} WH - {abbr}"


def create_ict(from_co, to_co, items_data):
    doc = frappe.new_doc("Inter Company Transfer")
    doc.company = from_co
    doc.to_company = to_co
    doc.posting_date = nowdate()
    doc.transaction_type = "Inter Company Stock Transfer"
    for item in items_data:
        doc.append("items", item)
    doc.insert(ignore_permissions=True)
    return doc


def create_reservation(company, item, warehouse, qty, reserved_for="Swastik"):
    doc = frappe.new_doc("Stock Reservation")
    doc.company = company
    doc.item = item
    doc.warehouse = warehouse
    doc.reserved_qty = qty
    doc.reserved_for = reserved_for
    doc.stock_uom = "Nos"
    doc.insert(ignore_permissions=True)
    return doc


def execute():
    global PASS, FAIL, ERRORS
    PASS = 0
    FAIL = 0
    ERRORS = []
    start_time = time.time()

    print("=" * 70)
    print("BULK PRODUCTION TEST SUITE - ALL COMPANIES")
    print("=" * 70)

    # =============================================
    # SECTION 1: ICT BETWEEN ALL COMPANY PAIRS
    # =============================================
    print("\n--- SECTION 1: ICT Between All Company Pairs ---")

    # GE -> GEX
    def test_ge_gex_mustard():
        doc = create_ict("Geeta Enterprise", "Global Export", [
            {"item_code": "ENGINE-10W30", "qty": 20, "rate": 200, "source_warehouse": wh("Geeta Enterprise"), "target_warehouse": wh("Global Export")},
        ])
        doc.submit()
        assert doc.status == "Transfer Created"
        assert len(doc.generated_documents) == 4
        doc.cancel()
        return True

    def test_ge_gex_multi_item():
        doc = create_ict("Geeta Enterprise", "Global Export", [
            {"item_code": "ENGINE-10W30", "qty": 15, "rate": 200, "source_warehouse": wh("Geeta Enterprise"), "target_warehouse": wh("Global Export")},
            {"item_code": "ENGINE-15W40", "qty": 10, "rate": 250, "source_warehouse": wh("Geeta Enterprise"), "target_warehouse": wh("Global Export")},
            {"item_code": "ENGINE-20W50", "qty": 8, "rate": 180, "source_warehouse": wh("Geeta Enterprise"), "target_warehouse": wh("Global Export")},
        ])
        doc.submit()
        assert doc.total_qty == 33
        assert doc.total == flt(15 * 200 + 10 * 250 + 8 * 180)
        doc.cancel()
        return True

    # GE -> SHE
    def test_ge_she_mustard():
        doc = create_ict("Geeta Enterprise", "Shubham Enterprise", [
            {"item_code": "ENGINE-10W30", "qty": 25, "rate": 200, "source_warehouse": wh("Geeta Enterprise"), "target_warehouse": wh("Shubham Enterprise")},
        ])
        doc.submit()
        assert len(doc.generated_documents) == 4
        doc.cancel()
        return True

    def test_ge_she_groundnut():
        doc = create_ict("Geeta Enterprise", "Shubham Enterprise", [
            {"item_code": "ENGINE-15W40", "qty": 12, "rate": 250, "source_warehouse": wh("Geeta Enterprise"), "target_warehouse": wh("Shubham Enterprise")},
        ])
        doc.submit()
        doc.cancel()
        return True

    # GEX -> GE
    def test_gex_ge_sunflower():
        doc = create_ict("Global Export", "Geeta Enterprise", [
            {"item_code": "ENGINE-20W50", "qty": 18, "rate": 180, "source_warehouse": wh("Global Export"), "target_warehouse": wh("Geeta Enterprise")},
        ])
        doc.submit()
        doc.cancel()
        return True

    # GEX -> SHE
    def test_gex_she_castor():
        doc = create_ict("Global Export", "Shubham Enterprise", [
            {"item_code": "ENGINE-5W30", "qty": 14, "rate": 220, "source_warehouse": wh("Global Export"), "target_warehouse": wh("Shubham Enterprise")},
        ])
        doc.submit()
        doc.cancel()
        return True

    # SHE -> GE
    def test_she_ge_multi():
        doc = create_ict("Shubham Enterprise", "Geeta Enterprise", [
            {"item_code": "ENGINE-10W30", "qty": 10, "rate": 200, "source_warehouse": wh("Shubham Enterprise"), "target_warehouse": wh("Geeta Enterprise")},
            {"item_code": "ENGINE-5W30", "qty": 6, "rate": 220, "source_warehouse": wh("Shubham Enterprise"), "target_warehouse": wh("Geeta Enterprise")},
        ])
        doc.submit()
        doc.cancel()
        return True

    # SHE -> GEX
    def test_she_gex_groundnut():
        doc = create_ict("Shubham Enterprise", "Global Export", [
            {"item_code": "ENGINE-15W40", "qty": 20, "rate": 250, "source_warehouse": wh("Shubham Enterprise"), "target_warehouse": wh("Global Export")},
        ])
        doc.submit()
        doc.cancel()
        return True

    run_test("ICT-GE-GEX-1: GE->GEX single item", test_ge_gex_mustard)
    run_test("ICT-GE-GEX-2: GE->GEX multi items", test_ge_gex_multi_item)
    run_test("ICT-GE-SHE-1: GE->SHE mustard", test_ge_she_mustard)
    run_test("ICT-GE-SHE-2: GE->SHE groundnut", test_ge_she_groundnut)
    run_test("ICT-GEX-GE-1: GEX->GE sunflower", test_gex_ge_sunflower)
    run_test("ICT-GEX-SHE-1: GEX->SHE castor", test_gex_she_castor)
    run_test("ICT-SHE-GE-1: SHE->GE multi", test_she_ge_multi)
    run_test("ICT-SHE-GEX-1: SHE->GEX groundnut", test_she_gex_groundnut)

    # =============================================
    # SECTION 2: BULK ICT SUBMISSIONS (stress test)
    # =============================================
    print("\n--- SECTION 2: Bulk ICT Submissions ---")

    def test_bulk_ict_10():
        docs = []
        for i in range(10):
            item = ITEMS[i % len(ITEMS)]
            from_co = COMPANIES[i % 3]
            to_co = COMPANIES[(i + 1) % 3]
            doc = create_ict(from_co, to_co, [
                {"item_code": item, "qty": 5 + i, "rate": 200 + i * 10, "source_warehouse": wh(from_co), "target_warehouse": wh(to_co)},
            ])
            doc.submit()
            docs.append(doc)
        assert all(d.status == "Transfer Created" for d in docs)
        for d in docs:
            d.cancel()
        return True

    def test_bulk_ict_20():
        docs = []
        for i in range(20):
            item = ITEMS[i % len(ITEMS)]
            from_co = COMPANIES[i % 3]
            to_co = COMPANIES[(i + 1) % 3]
            doc = create_ict(from_co, to_co, [
                {"item_code": item, "qty": 3 + (i % 10), "rate": 200, "source_warehouse": wh(from_co), "target_warehouse": wh(to_co)},
            ])
            doc.submit()
            docs.append(doc)
        assert all(d.docstatus == 1 for d in docs)
        for d in docs:
            d.cancel()
        return True

    run_test("BULK-ICT-1: 10 ICTs across all companies", test_bulk_ict_10)
    run_test("BULK-ICT-2: 20 ICTs across all companies", test_bulk_ict_20)

    # =============================================
    # SECTION 3: STOCK RESERVATIONS - ALL COMPANIES
    # =============================================
    print("\n--- SECTION 3: Stock Reservations - All Companies ---")

    def test_res_ge_mustard():
        r = create_reservation("Geeta Enterprise", "ENGINE-10W30", wh("Geeta Enterprise"), 10)
        r.submit()
        assert r.status == "Reserved"
        r.release_reservation()
        return True

    def test_res_ge_groundnut():
        r = create_reservation("Geeta Enterprise", "ENGINE-15W40", wh("Geeta Enterprise"), 8)
        r.submit()
        r.release_reservation()
        return True

    def test_res_ge_castor():
        r = create_reservation("Geeta Enterprise", "ENGINE-5W30", wh("Geeta Enterprise"), 6)
        r.submit()
        r.cancel()
        assert r.status == "Cancelled"
        return True

    def test_res_gex_mustard():
        r = create_reservation("Global Export", "ENGINE-10W30", wh("Global Export"), 12)
        r.submit()
        r.release_reservation()
        return True

    def test_res_gex_sunflower():
        r = create_reservation("Global Export", "ENGINE-20W50", wh("Global Export"), 7)
        r.submit()
        r.release_reservation()
        return True

    def test_res_she_mustard():
        r = create_reservation("Shubham Enterprise", "ENGINE-10W30", wh("Shubham Enterprise"), 9)
        r.submit()
        r.release_reservation()
        return True

    def test_res_she_castor():
        r = create_reservation("Shubham Enterprise", "ENGINE-5W30", wh("Shubham Enterprise"), 5)
        r.submit()
        r.release_reservation()
        return True

    def test_res_she_groundnut():
        r = create_reservation("Shubham Enterprise", "ENGINE-15W40", wh("Shubham Enterprise"), 11)
        r.submit()
        r.cancel()
        return True

    run_test("RES-GE-1: GE mustard reserve+release", test_res_ge_mustard)
    run_test("RES-GE-2: GE groundnut reserve+release", test_res_ge_groundnut)
    run_test("RES-GE-3: GE castor reserve+cancel", test_res_ge_castor)
    run_test("RES-GEX-1: GEX mustard reserve+release", test_res_gex_mustard)
    run_test("RES-GEX-2: GEX sunflower reserve+release", test_res_gex_sunflower)
    run_test("RES-SHE-1: SHE mustard reserve+release", test_res_she_mustard)
    run_test("RES-SHE-2: SHE castor reserve+release", test_res_she_castor)
    run_test("RES-SHE-3: SHE groundnut reserve+cancel", test_res_she_groundnut)

    # =============================================
    # SECTION 4: BULK RESERVATIONS
    # =============================================
    print("\n--- SECTION 4: Bulk Reservations ---")

    def test_bulk_reservations_15():
        docs = []
        for i in range(15):
            company = COMPANIES[i % 3]
            item = ITEMS[i % len(ITEMS)]
            r = create_reservation(company, item, wh(company), 3 + i)
            r.submit()
            docs.append(r)
        assert all(d.status == "Reserved" for d in docs)
        for d in docs:
            d.release_reservation()
        return True

    run_test("BULK-RES-1: 15 reservations across all companies", test_bulk_reservations_15)

    # =============================================
    # SECTION 5: ICT THEN RESERVE (cross-flow)
    # =============================================
    print("\n--- SECTION 5: ICT Then Reserve (Cross-Flow) ---")

    def test_ict_then_reserve_ge():
        doc = create_ict("Geeta Enterprise", "Global Export", [
            {"item_code": "ENGINE-10W30", "qty": 30, "rate": 200, "source_warehouse": wh("Geeta Enterprise"), "target_warehouse": wh("Global Export")},
        ])
        doc.submit()
        r = create_reservation("Global Export", "ENGINE-10W30", wh("Global Export"), 10)
        r.submit()
        assert r.status == "Reserved"
        r.release_reservation()
        doc.cancel()
        return True

    def test_ict_then_reserve_she():
        doc = create_ict("Shubham Enterprise", "Geeta Enterprise", [
            {"item_code": "ENGINE-15W40", "qty": 25, "rate": 250, "source_warehouse": wh("Shubham Enterprise"), "target_warehouse": wh("Geeta Enterprise")},
        ])
        doc.submit()
        r = create_reservation("Geeta Enterprise", "ENGINE-15W40", wh("Geeta Enterprise"), 15)
        r.submit()
        r.release_reservation()
        doc.cancel()
        return True

    def test_reserve_then_ict():
        r = create_reservation("Geeta Enterprise", "ENGINE-20W50", wh("Geeta Enterprise"), 5)
        r.submit()
        doc = create_ict("Geeta Enterprise", "Global Export", [
            {"item_code": "ENGINE-20W50", "qty": 20, "rate": 180, "source_warehouse": wh("Geeta Enterprise"), "target_warehouse": wh("Global Export")},
        ])
        doc.submit()
        r.release_reservation()
        doc.cancel()
        return True

    run_test("CROSS-1: ICT GE->GEX then reserve GEX", test_ict_then_reserve_ge)
    run_test("CROSS-2: ICT SHE->GE then reserve GE", test_ict_then_reserve_she)
    run_test("CROSS-3: Reserve GE then ICT GE->GEX", test_reserve_then_ict)

    # =============================================
    # SECTION 6: VALIDATIONS & EDGE CASES
    # =============================================
    print("\n--- SECTION 6: Validations & Edge Cases ---")

    def test_same_company_rejected():
        try:
            doc = create_ict("Geeta Enterprise", "Geeta Enterprise", [
                {"item_code": "ENGINE-10W30", "qty": 10, "rate": 200, "source_warehouse": wh("Geeta Enterprise"), "target_warehouse": wh("Geeta Enterprise")},
            ])
            doc.submit()
            return False
        except Exception:
            return True

    def test_no_items_rejected():
        try:
            doc = create_ict("Geeta Enterprise", "Global Export", [])
            doc.submit()
            return False
        except Exception:
            return True

    def test_zero_qty_rejected():
        try:
            doc = create_ict("Geeta Enterprise", "Global Export", [
                {"item_code": "ENGINE-10W30", "qty": 0, "rate": 200, "source_warehouse": wh("Geeta Enterprise"), "target_warehouse": wh("Global Export")},
            ])
            doc.submit()
            return False
        except Exception:
            return True

    def test_wrong_warehouse_rejected():
        try:
            r = create_reservation("Geeta Enterprise", "ENGINE-10W30", wh("Global Export"), 5)
            r.submit()
            return False
        except Exception:
            return True

    def test_zero_qty_reservation_rejected():
        try:
            r = create_reservation("Geeta Enterprise", "ENGINE-10W30", wh("Geeta Enterprise"), 0)
            r.submit()
            return False
        except Exception:
            return True

    def test_double_cancel_ict():
        doc = create_ict("Geeta Enterprise", "Global Export", [
            {"item_code": "ENGINE-10W30", "qty": 5, "rate": 200, "source_warehouse": wh("Geeta Enterprise"), "target_warehouse": wh("Global Export")},
        ])
        doc.submit()
        doc.cancel()
        try:
            doc.cancel()
            return False
        except Exception:
            return True

    def test_double_release_reservation():
        r = create_reservation("Geeta Enterprise", "ENGINE-10W30", wh("Geeta Enterprise"), 3)
        r.submit()
        r.release_reservation()
        try:
            r.release_reservation()
            return False
        except Exception:
            return True

    def test_concurrent_reservations_same_item():
        r1 = create_reservation("Geeta Enterprise", "ENGINE-5W30", wh("Geeta Enterprise"), 3)
        r1.submit()
        r2 = create_reservation("Geeta Enterprise", "ENGINE-5W30", wh("Geeta Enterprise"), 2)
        r2.submit()
        assert r1.docstatus == 1 and r2.docstatus == 1
        r1.release_reservation()
        r2.release_reservation()
        return True

    run_test("VAL-1: Same company rejected", test_same_company_rejected)
    run_test("VAL-2: No items rejected", test_no_items_rejected)
    run_test("VAL-3: Zero qty rejected", test_zero_qty_rejected)
    run_test("VAL-4: Wrong warehouse rejected", test_wrong_warehouse_rejected)
    run_test("VAL-5: Zero qty reservation rejected", test_zero_qty_reservation_rejected)
    run_test("VAL-6: Double cancel ICT", test_double_cancel_ict)
    run_test("VAL-7: Double release reservation", test_double_release_reservation)
    run_test("VAL-8: Concurrent reservations same item", test_concurrent_reservations_same_item)

    # =============================================
    # SECTION 7: REPORTS WITH POPULATED DATA
    # =============================================
    print("\n--- SECTION 7: Reports With Populated Data ---")

    def test_neg_stock_report():
        cols, data = frappe.get_attr("oil_distribution.dashboard_reports.report.negative_stock_report.negative_stock_report.execute")()
        assert len(cols) == 6
        return True

    def test_neg_stock_filter_ge():
        cols, data = frappe.get_attr("oil_distribution.dashboard_reports.report.negative_stock_report.negative_stock_report.execute")({"company": "Geeta Enterprise"})
        return True

    def test_avail_reserved_report():
        cols, data = frappe.get_attr("oil_distribution.dashboard_reports.report.available_vs_reserved.available_vs_reserved.execute")()
        assert len(cols) == 6
        return True

    def test_avail_reserved_filter_gex():
        cols, data = frappe.get_attr("oil_distribution.dashboard_reports.report.available_vs_reserved.available_vs_reserved.execute")({"company": "Global Export"})
        return True

    def test_reserved_stock_report():
        cols, data = frappe.get_attr("oil_distribution.dashboard_reports.report.reserved_stock.reserved_stock.execute")()
        assert len(cols) == 10
        return True

    def test_reserved_stock_filter_she():
        cols, data = frappe.get_attr("oil_distribution.dashboard_reports.report.reserved_stock.reserved_stock.execute")({"company": "Shubham Enterprise"})
        return True

    def test_iocl_report():
        cols, data = frappe.get_attr("oil_distribution.dashboard_reports.report.iocl_procurement_report.iocl_procurement_report.execute")()
        assert len(cols) == 6
        return True

    def test_iocl_filter_ge():
        cols, data = frappe.get_attr("oil_distribution.dashboard_reports.report.iocl_procurement_report.iocl_procurement_report.execute")({"company": "Geeta Enterprise"})
        return True

    def test_company_wise_stock():
        cols, data = frappe.get_attr("oil_distribution.dashboard_reports.report.company_wise_stock.company_wise_stock.execute")()
        assert len(cols) == 6
        return True

    def test_company_wise_filter_she():
        cols, data = frappe.get_attr("oil_distribution.dashboard_reports.report.company_wise_stock.company_wise_stock.execute")({"company": "Shubham Enterprise"})
        return True

    def test_intercompany_report():
        cols, data = frappe.get_attr("oil_distribution.dashboard_reports.report.intercompany_transfer_report.intercompany_transfer_report.execute")()
        assert len(cols) == 6
        return True

    def test_intercompany_filter_ge():
        cols, data = frappe.get_attr("oil_distribution.dashboard_reports.report.intercompany_transfer_report.intercompany_transfer_report.execute")({"from_company": "Geeta Enterprise"})
        return True

    run_test("RPT-1: Negative stock report", test_neg_stock_report)
    run_test("RPT-2: Negative stock filter GE", test_neg_stock_filter_ge)
    run_test("RPT-3: Available vs Reserved", test_avail_reserved_report)
    run_test("RPT-4: Available vs Reserved filter GEX", test_avail_reserved_filter_gex)
    run_test("RPT-5: Reserved stock report", test_reserved_stock_report)
    run_test("RPT-6: Reserved stock filter SHE", test_reserved_stock_filter_she)
    run_test("RPT-7: IOCL procurement report", test_iocl_report)
    run_test("RPT-8: IOCL filter GE", test_iocl_filter_ge)
    run_test("RPT-9: Company wise stock", test_company_wise_stock)
    run_test("RPT-10: Company wise filter SHE", test_company_wise_filter_she)
    run_test("RPT-11: Intercompany transfer report", test_intercompany_report)
    run_test("RPT-12: Intercompany filter GE", test_intercompany_filter_ge)

    # =============================================
    # SECTION 8: SETTINGS & EDGE CASES
    # =============================================
    print("\n--- SECTION 8: Settings & Edge Cases ---")

    def test_settings_singleton():
        s1 = frappe.get_doc("Transfer Settings")
        s2 = frappe.get_doc("Transfer Settings")
        assert s1.name == s2.name
        return True

    def test_settings_fields():
        s = frappe.get_doc("Transfer Settings")
        assert s.name == "Transfer Settings"
        return True

    def test_settings_update():
        s = frappe.get_doc("Transfer Settings")
        s.auto_create_intercompany_docs = 1
        s.save()
        s.reload()
        assert s.auto_create_intercompany_docs == 1
        s.auto_create_intercompany_docs = 0
        s.save()
        return True

    run_test("STG-1: Settings singleton", test_settings_singleton)
    run_test("STG-2: Settings fields exist", test_settings_fields)
    run_test("STG-3: Settings update", test_settings_update)

    # =============================================
    # SECTION 9: DATA INTEGRITY CHECKS
    # =============================================
    print("\n--- SECTION 9: Data Integrity ---")

    def test_all_companies_have_warehouses():
        for co in COMPANIES:
            abbr = COMPANY_ABBRS[co]
            avail = frappe.db.exists("Warehouse", f"Available WH - {abbr}")
            reserved = frappe.db.exists("Warehouse", f"Reserved WH - {abbr}")
            assert avail, f"Missing Available WH for {co}"
            assert reserved, f"Missing Reserved WH for {co}"
        return True

    def test_all_items_exist():
        for item in ITEMS:
            assert frappe.db.exists("Item", item), f"Missing item {item}"
        return True

    def test_intercompany_customers_exist():
        for co in COMPANIES:
            abbr = COMPANY_ABBRS[co]
            cust_name = f"{abbr} Customer"
            assert frappe.db.exists("Customer", cust_name), f"Missing customer {cust_name}"
            cust = frappe.get_doc("Customer", cust_name)
            assert cust.is_internal_customer == 1
            assert cust.represents_company == co
        return True

    def test_intercompany_suppliers_exist():
        for co in COMPANIES:
            abbr = COMPANY_ABBRS[co]
            supp_name = f"{abbr} Supplier"
            assert frappe.db.exists("Supplier", supp_name), f"Missing supplier {supp_name}"
            supp = frappe.get_doc("Supplier", supp_name)
            assert supp.is_internal_supplier == 1
            assert supp.represents_company == co
        return True

    def test_transfer_settings_exist():
        assert frappe.db.exists("Transfer Settings", "Transfer Settings")
        return True

    def test_custom_roles_exist():
        for role in ["Intercompany Manager", "Reservation Manager", "Stock Reservation User"]:
            assert frappe.db.exists("Role", role), f"Missing role {role}"
        return True

    run_test("INT-1: All companies have warehouses", test_all_companies_have_warehouses)
    run_test("INT-2: All items exist", test_all_items_exist)
    run_test("INT-3: Inter-company customers exist", test_intercompany_customers_exist)
    run_test("INT-4: Inter-company suppliers exist", test_intercompany_suppliers_exist)
    run_test("INT-5: Transfer Settings exists", test_transfer_settings_exist)
    run_test("INT-6: Custom roles exist", test_custom_roles_exist)

    # =============================================
    # SUMMARY
    # =============================================
    elapsed = time.time() - start_time
    print("\n" + "=" * 70)
    print("BULK PRODUCTION TEST RESULTS")
    print("=" * 70)
    print(f"Total: {PASS + FAIL} | Passed: {PASS} | Failed: {FAIL} | Time: {elapsed:.1f}s")
    if ERRORS:
        print("\nFailed tests:")
        for e in ERRORS:
            print(e)
    print("=" * 70)

    return {"passed": PASS, "failed": FAIL, "errors": ERRORS}
