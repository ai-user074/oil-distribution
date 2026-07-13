import { createResource } from "frappe-ui"

export function getReservationKPIs(company = "All") {
  return frappe.call({
    method: "oil_distribution.api.oil_ops.get_reservation_kpis",
    args: { company },
  })
}

export function getReservedByCompany() {
  return frappe.call({
    method: "oil_distribution.api.oil_ops.get_reserved_by_company",
    args: {},
  })
}

export const reservationList = createResource({
  url: "oil_distribution.api.oil_ops.get_active_reservations",
  cache: "oil_distribution:reservations",
  params: { company: "All", limit: 30 },
  transform(data) {
    return data || []
  },
})

export function createStockReservation(data) {
  return frappe.call({
    method: "oil_distribution.api.oil_ops.create_stock_reservation",
    args: data,
  })
}
