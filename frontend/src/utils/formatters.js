export function formatQty(n) {
  if (n == null) return "-"
  const v = Number(n)
  if (v >= 100000) return (v / 100000).toFixed(1) + "L"
  if (v >= 1000) return (v / 1000).toFixed(1) + "K"
  return v.toLocaleString("en-IN")
}

export function formatCurrency(n) {
  if (n == null) return "-"
  const v = Number(n)
  if (v >= 10000000) return "₹" + (v / 10000000).toFixed(2) + "Cr"
  if (v >= 100000) return "₹" + (v / 100000).toFixed(2) + "L"
  if (v >= 1000) return "₹" + (v / 1000).toFixed(1) + "K"
  return "₹" + Number(v).toLocaleString("en-IN")
}

export function abbr(company) {
  const map = {
    "Geeta Enterprise": "GE",
    "Global Export": "GEX",
    "Shubham Enterprise": "SHE",
  }
  return map[company] || company?.substring(0, 3)?.toUpperCase() || ""
}

export function formatDate(dateStr) {
  if (!dateStr) return "-"
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "-"
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

export const COMPANY_COLORS = ["#6366f1", "#059669", "#d97706"]
