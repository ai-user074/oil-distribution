import { createApp } from "vue"
import App from "./App.vue"
import router from "./router"

import {
  Button,
  Input,
  setConfig,
  frappeRequest,
  resourcesPlugin,
  FormControl,
} from "frappe-ui"
import { IonicVue } from "@ionic/vue"

import { session } from "@/data/session"

/* Core Ionic CSS */
import "@ionic/vue/css/core.css"

/* Theme variables */
import "./theme/variables.css"
import "./main.css"

/* frappe.call polyfill — frappe-ui doesn't set window.frappe.call */
window.frappe = window.frappe || {}
window.frappe.call = async (opts, args) => {
  if (typeof opts === "string") {
    opts = { method: opts, args }
  }
  try {
    const result = await frappeRequest({ url: opts.method, params: opts.args || {} })
    const response = { message: result }
    if (opts.callback) opts.callback(response)
    return response
  } catch (e) {
    if (opts.callback) opts.callback({ message: null })
    if (opts.error) opts.error(e)
    throw e
  }
}

const app = createApp(App)

setConfig("resourceFetcher", frappeRequest)
app.use(resourcesPlugin)

app.component("Button", Button)
app.component("Input", Input)
app.component("FormControl", FormControl)

app.use(router)
app.use(IonicVue)

app.provide("$session", session)

router.isReady().then(() => {
  app.mount("#app")
}).catch((err) => {
  console.error("Router initialization failed:", err)
  app.mount("#app")
})
