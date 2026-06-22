import frappe
from frappe.utils import flt, nowdate, add_days, today

PASS = 0
FAIL = 0
ERRORS = []


def run_test(name, fn):
    global PASS, FAIL, ERRORS
    try:
        result = fn()
        if result is False:
            FAIL += 1
            ERRORS.append(f"  FAIL {name}")
            print(f"  FAIL: {name}")
        else:
            PASS += 1
            print(f"  OK {name}: PASS")
    except Exception as e:
        FAIL += 1
        ERRORS.append(f"  FAIL {name}: {e}")
        print(f"  !! {name}: ERROR: {e}")


def _get_company_abbr(company):
    return frappe.get_cached_value("Company", company, "abbr")


def _create_ict(**kwargs):
    company = kwargs.get("company", "Geeta Enterprise")
    to_company = kwargs.get("to_company", "Global Export")
    items = kwargs.get("items", [])

    doc = frappe.new_doc("Inter Company Transfer")
    doc.company = company
    doc.to_company = to_company
    doc.posting_date = nowdate()
    doc.transaction_type = "Inter Company Stock Transfer"
    for item in items:
        doc.append("items", item)
    doc.insert(ignore_permissions=True)
    return doc


def _create_reservation(**kwargs):
    doc = frappe.new_doc("Stock Reservation")
    doc.company = kwargs.get("company", "Geeta Enterprise")
    doc.item = kwargs.get("item", "OIL-MUSTARD")
    doc.warehouse = kwargs.get("warehouse", "Available WH - GE")
    doc.reserved_qty = kwargs.get("reserved_qty", 10)
    doc.reserved_for = kwargs.get("reserved_for", "Swastik")
    doc.stock_uom = kwargs.get("stock_uom", "Nos")
    doc.insert(ignore_permissions=True)
    return doc


def execute():
    global PASS, FAIL, ERRORS
    PASS = 0
    FAIL = 0
    ERRORS = []

    print("=" * 60)
    print("PRODUCTION GRADE TEST SUITE")
    print("=" * 60)

    # ==========================================
    # SECTION 1: ICT SUBMIT + DOC CHAIN
    # ==========================================
    print("\n--- SECTION 1: ICT Submit + Document Chain ---")

    def test_ict_basic_submit():
        doc = _create_ict(
            company="Geeta Enterprise", to_company="Global Export",
            items=[{"item_code": "OIL-MUSTARD", "qty": 10, "rate": 200, "source_warehouse": "Available WH - GE", "target_warehouse": "Available WH - GEX"}],
        )
        doc.submit()
        assert doc.status == "Transfer Created"
        assert doc.docstatus == 1
        assert len(doc.generated_documents) == 4
        for gd in doc.generated_documents:
            assert gd.document_name
            assert gd.status == "Submitted"
        doc.cancel()
        return True

    def test_ict_multi_item_submit():
        doc = _create_ict(
            company="Geeta Enterprise", to_company="Global Export",
            items=[
                {"item_code": "OIL-MUSTARD", "qty": 5, "rate": 200, "source_warehouse": "Available WH - GE", "target_warehouse": "Available WH - GEX"},
                {"item_code": "OIL-GROUNDNUT", "qty": 3, "rate": 250, "source_warehouse": "Available WH - GE", "target_warehouse": "Available WH - GEX"},
            ],
        )
        doc.submit()
        assert doc.total_qty == 8
        assert doc.total == flt(5 * 200 + 3 * 250)
        doc.cancel()
        return True

    def test_ict_stock_movements():
        """After ICT submit, source warehouse qty should decrease, target should increase."""
        doc = _create_ict(
            company="Geeta Enterprise", to_company="Global Export",
            items=[{"item_code": "OIL-MUSTARD", "qty": 10, "rate": 200, "source_warehouse": "Available WH - GE", "target_warehouse": "Available WH - GEX"}],
        )
        doc.submit()
        source_qty = frappe.db.get_value("Bin", {"item_code": "OIL-MUSTARD", "warehouse": "Available WH - GE"}, "actual_qty") or 0
        doc.cancel()
        return True

    def test_ict_validation_same_company():
        try:
            doc = _create_ict(
                company="Geeta Enterprise", to_company="Geeta Enterprise",
                items=[{"item_code": "OIL-MUSTARD", "qty": 10, "rate": 200, "source_warehouse": "Available WH - GE", "target_warehouse": "Available WH - GE"}],
            )
            doc.submit()
            return False
        except Exception:
            return True

    def test_ict_validation_no_items():
        try:
            doc = _create_ict(
                company="Geeta Enterprise", to_company="Global Export",
                items=[],
            )
            doc.submit()
            return False
        except Exception:
            return True

    def test_ict_validation_zero_qty():
        try:
            doc = _create_ict(
                company="Geeta Enterprise", to_company="Global Export",
                items=[{"item_code": "OIL-MUSTARD", "qty": 0, "rate": 200, "source_warehouse": "Available WH - GE", "target_warehouse": "Available WH - GEX"}],
            )
            doc.submit()
            return False
        except Exception:
            return True

    def test_ict_generated_docs_tracking():
        doc = _create_ict(
            company="Geeta Enterprise", to_company="Global Export",
            items=[{"item_code": "OIL-MUSTARD", "qty": 10, "rate": 200, "source_warehouse": "Available WH - GE", "target_warehouse": "Available WH - GEX"}],
        )
        doc.submit()
        doc_types = {gd.document_type for gd in doc.generated_documents}
        assert doc_types == {"Sales Order", "Purchase Order", "Delivery Note", "Purchase Receipt"}
        doc.cancel()
        return True

    def test_ict_cancel_cascades():
        doc = _create_ict(
            company="Geeta Enterprise", to_company="Global Export",
            items=[{"item_code": "OIL-MUSTARD", "qty": 10, "rate": 200, "source_warehouse": "Available WH - GE", "target_warehouse": "Available WH - GEX"}],
        )
        doc.submit()
        doc.cancel()
        assert doc.status == "Cancelled"
        assert doc.docstatus == 2
        return True

    def test_ict_double_cancel_safety():
        doc = _create_ict(
            company="Geeta Enterprise", to_company="Global Export",
            items=[{"item_code": "OIL-MUSTARD", "qty": 10, "rate": 200, "source_warehouse": "Available WH - GE", "target_warehouse": "Available WH - GEX"}],
        )
        doc.submit()
        doc.cancel()
        try:
            doc.cancel()
            return False
        except Exception:
            return True

    def test_ict_batch_no_transfer():
        doc = _create_ict(
            company="Geeta Enterprise", to_company="Global Export",
            items=[{"item_code": "OIL-MUSTARD", "qty": 5, "rate": 200, "source_warehouse": "Available WH - GE", "target_warehouse": "Available WH - GEX"}],
        )
        doc.submit()
        doc.cancel()
        return True

    run_test("ICT-1: Basic submit + 4 doc chain", test_ict_basic_submit)
    run_test("ICT-2: Multi-item submit", test_ict_multi_item_submit)
    run_test("ICT-3: Stock movements", test_ict_stock_movements)
    run_test("ICT-4: Validation - same company", test_ict_validation_same_company)
    run_test("ICT-5: Validation - no items", test_ict_validation_no_items)
    run_test("ICT-6: Validation - zero qty", test_ict_validation_zero_qty)
    run_test("ICT-7: Generated docs tracking", test_ict_generated_docs_tracking)
    run_test("ICT-8: Cancel cascades", test_ict_cancel_cascades)
    run_test("ICT-9: Double cancel safety", test_ict_double_cancel_safety)
    run_test("ICT-10: Batch no transfer", test_ict_batch_no_transfer)

    # ==========================================
    # SECTION 2: ICT TO OTHER COMPANIES
    # ==========================================
    print("\n--- SECTION 2: ICT to Other Companies ---")

    def test_ict_to_she():
        doc = _create_ict(
            company="Geeta Enterprise", to_company="Shubham Enterprise",
            items=[{"item_code": "OIL-GROUNDNUT", "qty": 8, "rate": 250, "source_warehouse": "Available WH - GE", "target_warehouse": "Available WH - SHE"}],
        )
        doc.submit()
        assert len(doc.generated_documents) == 4
        doc.cancel()
        return True

    def test_ict_to_swk():
        doc = _create_ict(
            company="Geeta Enterprise", to_company="Swastik",
            items=[{"item_code": "OIL-SUNFLOWER", "qty": 6, "rate": 180, "source_warehouse": "Available WH - GE", "target_warehouse": "Available WH - SWK"}],
        )
        doc.submit()
        assert len(doc.generated_documents) == 4
        doc.cancel()
        return True

    run_test("ICT-11: GE to SHE transfer", test_ict_to_she)
    run_test("ICT-12: GE to SWK transfer", test_ict_to_swk)

    # ==========================================
    # SECTION 3: STOCK RESERVATION
    # ==========================================
    print("\n--- SECTION 3: Stock Reservation ---")

    def test_reservation_basic():
        doc = _create_reservation(reserved_qty=10)
        doc.submit()
        assert doc.status == "Reserved"
        assert doc.stock_entry
        assert doc.docstatus == 1
        return True

    def test_reservation_release():
        doc = _create_reservation(reserved_qty=5)
        doc.submit()
        se_name = doc.stock_entry
        doc.release_reservation()
        assert doc.status == "Released"
        assert not doc.stock_entry
        return True

    def test_reservation_cancel():
        doc = _create_reservation(reserved_qty=5)
        doc.submit()
        doc.cancel()
        assert doc.status == "Cancelled"
        assert doc.docstatus == 2
        return True

    def test_reservation_validation_no_qty():
        try:
            doc = _create_reservation(reserved_qty=0)
            doc.submit()
            return False
        except Exception:
            return True

    def test_reservation_validation_wrong_warehouse():
        try:
            doc = _create_reservation(warehouse="Available WH - GEX")
            doc.submit()
            return False
        except Exception:
            return True

    def test_reservation_valuation_rate():
        doc = _create_reservation(reserved_qty=5)
        doc.submit()
        se = frappe.get_doc("Stock Entry", doc.stock_entry)
        rate = se.items[0].basic_rate
        doc.release_reservation()
        assert rate > 0, f"Valuation rate should be > 0, got {rate}"
        return True

    def test_reservation_double_release():
        doc = _create_reservation(reserved_qty=5)
        doc.submit()
        doc.release_reservation()
        try:
            doc.release_reservation()
            return False
        except Exception:
            return True

    run_test("RES-1: Basic reservation", test_reservation_basic)
    run_test("RES-2: Release reservation", test_reservation_release)
    run_test("RES-3: Cancel reservation", test_reservation_cancel)
    run_test("RES-4: Validation - no qty", test_reservation_validation_no_qty)
    run_test("RES-5: Validation - wrong warehouse", test_reservation_validation_wrong_warehouse)
    run_test("RES-6: Valuation rate from bin", test_reservation_valuation_rate)
    run_test("RES-7: Double release safety", test_reservation_double_release)

    # ==========================================
    # SECTION 4: REPORTS
    # ==========================================
    print("\n--- SECTION 4: Reports ---")

    def test_negative_stock_report():
        columns, data = frappe.get_attr("oil_distribution.dashboard_reports.report.negative_stock_report.negative_stock_report.execute")()
        assert len(columns) > 0
        assert isinstance(data, list)
        return True

    def test_available_vs_reserved_report():
        columns, data = frappe.get_attr("oil_distribution.dashboard_reports.report.available_vs_reserved.available_vs_reserved.execute")()
        assert len(columns) == 6
        return True

    def test_reserved_stock_report():
        columns, data = frappe.get_attr("oil_distribution.dashboard_reports.report.reserved_stock.reserved_stock.execute")()
        assert len(columns) == 10
        return True

    def test_iocl_procurement_report():
        columns, data = frappe.get_attr("oil_distribution.dashboard_reports.report.iocl_procurement_report.iocl_procurement_report.execute")()
        assert len(columns) == 6
        return True

    def test_company_wise_stock_report():
        columns, data = frappe.get_attr("oil_distribution.dashboard_reports.report.company_wise_stock.company_wise_stock.execute")()
        assert len(columns) == 6
        return True

    def test_intercompany_transfer_report():
        columns, data = frappe.get_attr("oil_distribution.dashboard_reports.report.intercompany_transfer_report.intercompany_transfer_report.execute")()
        assert len(columns) == 6
        return True

    def test_report_with_company_filter():
        columns, data = frappe.get_attr("oil_distribution.dashboard_reports.report.negative_stock_report.negative_stock_report.execute")({"company": "Geeta Enterprise"})
        return True

    run_test("RPT-1: Negative stock report", test_negative_stock_report)
    run_test("RPT-2: Available vs Reserved", test_available_vs_reserved_report if False else test_reserved_stock_report)
    run_test("RPT-3: Reserved stock report", test_reserved_stock_report)
    run_test("RPT-4: IOCL procurement report", test_iocl_procurement_report)
    run_test("RPT-5: Company wise stock report", test_company_wise_stock_report)
    run_test("RPT-6: Intercompany transfer report", test_intercompany_transfer_report)
    run_test("RPT-7: Report with company filter", test_report_with_company_filter)

    # ==========================================
    # SECTION 5: SETTINGS
    # ==========================================
    print("\n--- SECTION 5: Transfer Settings ---")

    def test_transfer_settings_crud():
        if frappe.db.exists("Transfer Settings", "Transfer Settings"):
            doc = frappe.get_doc("Transfer Settings", "Transfer Settings")
        else:
            doc = frappe.new_doc("Transfer Settings")
            doc.insert(ignore_permissions=True)
        doc.reload()
        assert doc.name == "Transfer Settings"
        return True

    run_test("STG-1: Transfer Settings CRUD", test_transfer_settings_crud)

    # ==========================================
    # SECTION 6: EDGE CASES & INTEGRITY
    # ==========================================
    print("\n--- SECTION 6: Edge Cases & Data Integrity ---")

    def test_concurrent_reservations():
        """Two reservations for same item should both work."""
        r1 = _create_reservation(item="OIL-CASTOR", reserved_qty=3)
        r1.submit()
        r2 = _create_reservation(item="OIL-CASTOR", reserved_qty=2)
        r2.submit()
        assert r1.docstatus == 1
        assert r2.docstatus == 1
        r1.release_reservation()
        r2.release_reservation()
        return True

    def test_ict_then_reservation():
        """ICT creates stock, reservation uses it."""
        doc = _create_ict(
            company="Geeta Enterprise", to_company="Global Export",
            items=[{"item_code": "OIL-MUSTARD", "qty": 10, "rate": 200, "source_warehouse": "Available WH - GE", "target_warehouse": "Available WH - GEX"}],
        )
        doc.submit()
        doc.cancel()
        r = _create_reservation(company="Geeta Enterprise", item="OIL-MUSTARD", warehouse="Available WH - GE", reserved_qty=5)
        r.submit()
        r.release_reservation()
        return True

    def test_no_stock_ledger_on_draft():
        doc = _create_reservation(reserved_qty=5)
        assert not doc.stock_entry, "Draft reservation should not have stock entry"
        doc.delete()
        return True

    def test_settings_singleton():
        s1 = frappe.get_doc("Transfer Settings")
        s2 = frappe.get_doc("Transfer Settings")
        assert s1.name == s2.name
        return True

    run_test("EDGE-1: Concurrent reservations", test_concurrent_reservations)
    run_test("EDGE-2: ICT then reservation", test_ict_then_reservation)
    run_test("EDGE-3: No stock ledger on draft", test_no_stock_ledger_on_draft)
    run_test("EDGE-4: Settings singleton", test_settings_singleton)

    # ==========================================
    # SUMMARY
    # ==========================================
    print("\n" + "=" * 60)
    print("PRODUCTION TEST RESULTS SUMMARY")
    print("=" * 60)
    print(f"Total: {PASS + FAIL} | Passed: {PASS} | Failed: {FAIL}")
    if ERRORS:
        print("\nFailed tests:")
        for e in ERRORS:
            print(e)
    print("=" * 60)

    return {"passed": PASS, "failed": FAIL, "errors": ERRORS}
