import { createResource } from "frappe-ui"

export function getSalesKPIs(company = "All") {
  return frappe.call({
    method: "oil_distribution.api.oil_ops.get_sales_kpis",
    args: { company },
  })
}

export function getPendingSalesOrders(company = "All", limit = 20) {
  return frappe.call({
    method: "oil_distribution.api.oil_ops.get_pending_sales_orders",
    args: { company, limit },
  })
}

export function getRecentDeliveryNotes(company = "All", limit = 20) {
  return frappe.call({
    method: "oil_distribution.api.oil_ops.get_recent_delivery_notes",
    args: { company, limit },
  })
}

export function getTopCustomers(company = "All", limit = 10) {
  return frappe.call({
    method: "oil_distribution.api.oil_ops.get_top_customers",
    args: { company, limit },
  })
}
