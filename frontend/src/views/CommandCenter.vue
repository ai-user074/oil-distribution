<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button /></ion-buttons>
        <ion-title>Command Center</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page anim-fade">
        <div class="hero" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)">
          <div class="flex items-center justify-between mb-3 relative z-10">
            <div>
              <div class="text-xs font-semibold tracking-wider opacity-70">COMMAND CENTER</div>
              <div class="hero-title">Executive Overview</div>
              <div class="hero-desc">Real-time business performance</div>
            </div>
            <div class="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
              <div class="text-[10px] font-semibold text-white/70">P&L</div>
              <div class="text-lg font-extrabold text-white">{{ fmt(pnl) }}</div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3 mt-4 relative z-10">
            <div v-for="s in quickStats" :key="s.label" class="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3">
              <div class="flex items-center gap-2 text-xs font-medium text-white/70">
                <ion-icon :icon="s.icon" class="text-sm" />{{ s.label }}
              </div>
              <div class="text-lg font-extrabold text-white mt-0.5">{{ s.value }}</div>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 mb-4">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-sm">
            <ion-icon :icon="barChartOutline" class="text-white text-sm" />
          </div>
          <div>
            <div class="text-sm font-bold text-gray-900">Sales vs Procurement</div>
            <div class="text-xs text-gray-400">Month to date by company</div>
          </div>
        </div>

        <div v-if="companies.length" class="flex flex-col gap-2.5 mb-5">
          <div v-for="(c,i) in companies" :key="c.company"
            class="bg-white rounded-xl px-4 py-3.5 border border-gray-100 shadow-sm anim-up transition-all duration-200 hover:shadow-md"
            :style="{ animationDelay: i*0.06+'s' }">
            <div class="flex items-center justify-between mb-2.5">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-extrabold"
                  :style="{ background: gradients[i%gradients.length] }">{{ c.abbr }}</div>
                <div class="text-sm font-bold text-gray-900">{{ c.company }}</div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-emerald-50 rounded-lg px-3 py-2">
                <div class="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">Sales</div>
                <div class="text-sm font-extrabold text-emerald-700">{{ fmt(c.sales) }}</div>
              </div>
              <div class="bg-amber-50 rounded-lg px-3 py-2">
                <div class="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">Procurement</div>
                <div class="text-sm font-extrabold text-amber-700">{{ fmt(c.purchase) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 mb-4">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
            <ion-icon :icon="flameOutline" class="text-white text-sm" />
          </div>
          <div>
            <div class="text-sm font-bold text-gray-900">Top Items</div>
            <div class="text-xs text-gray-400">Best selling this month</div>
          </div>
        </div>

        <div v-if="topItems.length" class="flex flex-col gap-2">
          <div v-for="(item,i) in topItems" :key="item.item_code"
            class="bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm anim-up transition-all duration-200 hover:shadow-md"
            :style="{ animationDelay: i*0.04+'s' }">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="text-xs font-bold text-gray-400 w-5">#{{ i+1 }}</span>
                <div>
                  <div class="text-sm font-semibold text-gray-900">{{ item.item_code }}</div>
                  <div class="text-xs text-gray-400">{{ item.qty }} units</div>
                </div>
              </div>
              <div class="text-sm font-extrabold text-gray-900">{{ fmt(item.revenue) }}</div>
            </div>
          </div>
        </div>
        <div v-else class="bg-white rounded-xl border border-gray-100 text-sm text-gray-400 text-center py-8 shadow-sm">No sales data this month</div>

        <div v-if="negAlerts.length" class="mt-5">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-sm">
              <ion-icon :icon="warningOutline" class="text-white text-sm" />
            </div>
            <div>
              <div class="text-sm font-bold text-gray-900">Negative Stock Alerts</div>
              <div class="text-xs text-gray-400">{{ negAlerts.length }} items need attention</div>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <div v-for="n in negAlerts" :key="n.warehouse+n.item_code"
              class="bg-white rounded-xl px-4 py-3 border border-red-100 shadow-sm">
              <div class="flex items-center justify-between text-sm">
                <div>
                  <span class="font-semibold text-gray-900">{{ n.item_code }}</span>
                  <span class="text-gray-400 mx-2">in</span>
                  <span class="font-medium text-gray-600">{{ n.warehouse }}</span>
                </div>
                <span class="font-extrabold text-red-500">{{ n.actual_qty }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonContent, IonMenuButton, IonIcon } from "@ionic/vue"
import { barChartOutline, flameOutline, warningOutline, trendingUpOutline, trendingDownOutline, cartOutline, walletOutline, archiveOutline, alertCircleOutline } from "ionicons/icons"
import { getCommandCenterKpis } from "@/api/command_center"

const gradients = ["linear-gradient(135deg,#667eea,#764ba2)","linear-gradient(135deg,#0ea5e9,#6366f1)","linear-gradient(135deg,#22c55e,#06b6d4)"]
const quickStats = ref([])
const companies = ref([])
const topItems = ref([])
const negAlerts = ref([])
const pnl = ref(0)

const fmt = v => "₹" + Number(v || 0).toLocaleString("en-IN",{maximumFractionDigits:0})

onMounted(async () => {
  try {
    const d = await getCommandCenterKpis()
    pnl.value = d.profit_loss || 0
    quickStats.value = [
      { label: "Sales MTD", value: fmt(d.sales_mtd), icon: trendingUpOutline },
      { label: "Procurement MTD", value: fmt(d.procurement_mtd), icon: trendingDownOutline },
      { label: "Available", value: d.available_stock, icon: archiveOutline },
      { label: "Reserved", value: d.reserved_stock, icon: walletOutline },
      { label: "ICT Volume", value: d.intercompany_volume, icon: cartOutline },
      { label: "Alerts", value: d.negative_alerts, icon: alertCircleOutline },
    ]

    // Build company comparison
    const coMap = {}
    for (const s of d.sales_by_company) { coMap[s.company] = coMap[s.company] || { sales: 0, purchase: 0 }; coMap[s.company].sales = s.total }
    for (const p of d.procurement_by_company) { coMap[p.company] = coMap[p.company] || { sales: 0, purchase: 0 }; coMap[p.company].purchase = p.total }
    const abbr = { "Geeta Enterprise": "GE", "Global Export": "GEX", "Shubham Enterprise": "SHE" }
    companies.value = Object.entries(coMap).map(([company, v]) => ({ company, ...v, abbr: abbr[company] || company.slice(0,3).toUpperCase() }))

    topItems.value = (d.top_items || []).slice(0, 5)
  } catch(e) { console.error(e) }

  try {
    const { getNegativeStock } = await import("@/api/stock")
    negAlerts.value = await getNegativeStock()
  } catch(e) {}
})
</script>
