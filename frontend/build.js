import { readFileSync, writeFileSync } from "fs"
import { resolve } from "path"

// Read built index.html
const builtHtml = readFileSync(
  resolve("../oil_distribution/public/frontend/index.html"),
  "utf-8"
)

// Inject Frappe template variables
const wwwTemplate = builtHtml.replace(
  "</title>",
  `</title>
  <script>
    window.csrf_token = "{{ csrf_token }}"
    window.boot = {{ boot | tojson }}
  </script>`
)

writeFileSync(
  resolve("../oil_distribution/www/oil-ops.html"),
  wwwTemplate
)

console.log("✓ www/oil-ops.html updated")
