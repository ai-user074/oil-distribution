import { createResource } from "frappe-ui"

export const userResource = createResource({
  url: "oil_distribution.api.oil_ops.get_current_user_info",
  cache: "oil_distribution:user",
  onError(error) {
    if (error && error.exc_type === "AuthenticationError") {
      window.location.href = "/login"
    }
  },
})
