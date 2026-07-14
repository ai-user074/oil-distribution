import { createApp } from "vue"
import { IonicVue } from "@ionic/vue"
import { FrappeUI } from "frappe-ui"

import App from "./App.vue"
import router from "./router"

import "@ionic/vue/css/core.css"
import "@ionic/vue/css/normalize.css"
import "@ionic/vue/css/structure.css"
import "@ionic/vue/css/typography.css"
import "@ionic/vue/css/padding.css"
import "@ionic/vue/css/float-elements.css"
import "@ionic/vue/css/text-alignment.css"
import "@ionic/vue/css/text-transformation.css"
import "@ionic/vue/css/flex-utils.css"
import "@ionic/vue/css/display.css"

import "./style.css"

const app = createApp(App)
app.use(IonicVue, { mode: "md" })
app.use(router)
app.use(FrappeUI)

const vm = app.mount("#app")

router.isReady().then(() => {
  console.log("Router ready")
}).catch((err) => {
  console.warn("Router error:", err)
})
