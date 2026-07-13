import { createResource } from "frappe-ui"

export function getProcurementKPIs(company = "All") {
  return frappe.call({
    method: "oil_distribution.api.oil_ops.get_procurement_kpis",
    args: { company },
  })
}

export function getPendingPurchaseOrders(company = "All", limit = 20) {
  return frappe.call({
    method: "oil_distribution.api.oil_ops.get_pending_purchase_orders",
    args: { company, limit },
  })
}

export function getRecentPurchaseReceipts(company = "All", limit = 20) {
  return frappe.call({
    method: "oil_distribution.api.oil_ops.get_recent_purchase_receipts",
    args: { company, limit },
  })
}
