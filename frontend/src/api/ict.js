import { frappeRequest } from "frappe-ui"

export function getIctKpis(company = "All") {
  return frappeRequest({
    url: "oil_distribution.api.oil_ops.get_ict_kpis",
    params: { company },
  })
}

export function getIctRoutes(company = "All") {
  return frappeRequest({
    url: "oil_distribution.api.oil_ops.get_ict_routes",
    params: { company },
  })
}

export function getIctList(limit = 30, company = "All") {
  return frappeRequest({
    url: "oil_distribution.api.oil_ops.get_ict_list",
    params: { limit, company },
  })
}

export function createInterCompanyTransfer(payload) {
  return frappeRequest({
    url: "oil_distribution.api.oil_ops.create_inter_company_transfer",
    params: payload,
  })
}
