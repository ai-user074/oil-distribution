import { createResource } from "frappe-ui"

export function getICTKPIs(company = "All") {
  return frappe.call({
    method: "oil_distribution.api.oil_ops.get_ict_kpis",
    args: { company },
  })
}

export function getICTRoutes(company = "All") {
  return frappe.call({
    method: "oil_distribution.api.oil_ops.get_ict_routes",
    args: { company },
  })
}

export const ictList = createResource({
  url: "oil_distribution.api.oil_ops.get_ict_list",
  cache: "oil_distribution:ict",
  params: { company: "All", limit: 30 },
  transform(data) {
    return data || []
  },
})

export function createICTTransfer(data) {
  return frappe.call({
    method: "oil_distribution.api.oil_ops.create_inter_company_transfer",
    args: data,
  })
}

export function getWarehouseOptions() {
  return frappe.call("frappe.client.get_list", {
    doctype: "Warehouse",
    fields: ["name"],
    limit: 200,
  })
}

export function getItemOptions() {
  return frappe.call("frappe.client.get_list", {
    doctype: "Item",
    fields: ["name", "item_name"],
    limit: 100,
  })
}
