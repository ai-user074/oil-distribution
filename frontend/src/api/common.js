import { frappeRequest } from "frappe-ui"

export function getCompanies() {
  return frappeRequest({
    url: "oil_distribution.api.oil_ops.get_companies",
  })
}

export function getItems() {
  return frappeRequest({
    url: "oil_distribution.api.oil_ops.get_items",
  })
}

export function getWarehouses() {
  return frappeRequest({
    url: "oil_distribution.api.oil_ops.get_warehouses",
  })
}

export function getCompanyWarehouses(company) {
  return frappeRequest({
    url: "oil_distribution.api.oil_ops.get_company_warehouses",
    params: { company },
  })
}

export function getCustomers() {
  return frappeRequest({
    url: "oil_distribution.api.oil_ops.get_customers",
  })
}

export function getSuppliers() {
  return frappeRequest({
    url: "oil_distribution.api.oil_ops.get_suppliers",
  })
}

export function getItemRate(itemCode) {
  return frappeRequest({
    url: "oil_distribution.api.oil_ops.get_item_rate",
    params: { item_code: itemCode },
  })
}
