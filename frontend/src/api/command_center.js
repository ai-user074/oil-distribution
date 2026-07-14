import { frappeRequest } from "frappe-ui"

export function getCommandCenterKpis(params = {}) {
  return frappeRequest({ url: "oil_distribution.api.oil_ops.get_command_center_kpis", params })
}
