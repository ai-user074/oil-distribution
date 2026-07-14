import { frappeRequest } from "frappe-ui"

export function getReservationKpis(company = "All") {
  return frappeRequest({
    url: "oil_distribution.api.oil_ops.get_reservation_kpis",
    params: { company },
  })
}

export function getReservedByCompany() {
  return frappeRequest({
    url: "oil_distribution.api.oil_ops.get_reserved_by_company",
  })
}

export function getActiveReservations(limit = 30, company = "All") {
  return frappeRequest({
    url: "oil_distribution.api.oil_ops.get_active_reservations",
    params: { limit, company },
  })
}

export function createStockReservation(payload) {
  return frappeRequest({
    url: "oil_distribution.api.oil_ops.create_stock_reservation",
    params: payload,
  })
}
