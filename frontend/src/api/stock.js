import { frappeRequest } from "frappe-ui"

export function getStockKpis(params = {}) {
  return frappeRequest({ url: "oil_distribution.api.oil_ops.get_stock_kpis", params })
}

export function getStockByCompany(params = {}) {
  return frappeRequest({ url: "oil_distribution.api.oil_ops.get_stock_by_company", params })
}

export function getStockByWarehouse(params = {}) {
  return frappeRequest({ url: "oil_distribution.api.oil_ops.get_stock_by_warehouse", params })
}

export function getStockByItem(params = {}) {
  return frappeRequest({ url: "oil_distribution.api.oil_ops.get_stock_by_item", params })
}

export function getStockMovement(params = {}) {
  return frappeRequest({ url: "oil_distribution.api.oil_ops.get_stock_movement", params })
}

export function getNegativeStock(params = {}) {
  return frappeRequest({ url: "oil_distribution.api.oil_ops.get_negative_stock", params })
}
