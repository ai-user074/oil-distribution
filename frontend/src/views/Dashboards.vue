<template>
  <ion-content>
    <div class="page anim-fade">
      <div class="hero">
        <div class="flex items-center justify-between mb-4 relative z-10">
          <div>
            <div class="text-xs font-semibold tracking-wider opacity-70">GEOperations</div>
            <div class="hero-title">Operations Dashboard</div>
            <div class="hero-desc">Real-time overview of your business</div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 mt-4 relative z-10">
          <div v-for="s in quickStats" :key="s.label" class="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3">
            <div class="flex items-center gap-2 text-xs font-medium text-white/70">{{ s.label }}</div>
            <div class="text-xl font-extrabold text-white mt-0.5">{{ s.value }}</div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 mb-5">
        <div v-for="(m,i) in modules" :key="m.label"
          class="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 anim-up"
          :style="{ animationDelay: i*0.06+'s' }" @click="$router.push(m.route)">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-3" :class="m.cls">
            <ion-icon :icon="m.icon" class="text-xl" />
          </div>
          <div class="text-sm font-bold text-gray-900">{{ m.label }}</div>
          <div class="text-xs text-gray-400 mt-1">{{ m.desc }}</div>
          <div class="flex items-center gap-1.5 mt-2.5 text-xs font-semibold" :class="m.accent">
            <span>{{ m.value }}</span>
            <ion-icon :icon="arrowForwardOutline" class="text-[10px]" />
          </div>
        </div>
      </div>

      <div class="text-xs font-bold text-gray-400 tracking-wider uppercase mb-3">Master Data</div>
      <div class="grid grid-cols-3 gap-3 mb-5">
        <div v-for="(m,i) in masters" :key="m.label"
          class="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 anim-up"
          :style="{ animationDelay: (i+5)*0.06+'s' }" @click="$router.push(m.route)">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-3" :class="m.cls">
            <ion-icon :icon="m.icon" class="text-xl" />
          </div>
          <div class="text-sm font-bold text-gray-900">{{ m.label }}</div>
          <div class="text-xs text-gray-400 mt-1">{{ m.desc }}</div>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="px-4 py-3.5 border-b border-gray-50 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
              <ion-icon :icon="flashOutline" class="text-white text-xs" />
            </div>
            <span class="text-sm font-bold text-gray-900">Quick Actions</span>
          </div>
        </div>
        <div class="grid grid-cols-2 divide-x divide-y divide-gray-50">
          <div v-for="a in actions" :key="a.label"
            class="flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-gray-50/80"
            @click="$router.push(a.route)">
            <ion-icon :icon="a.icon" class="text-base" :class="a.color" />
            <span class="text-sm font-medium text-gray-700">{{ a.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </ion-content>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonContent, IonIcon } from "@ionic/vue"
import { useRouter } from "vue-router"
import { arrowForwardOutline, flashOutline, swapHorizontalOutline, waterOutline, cartOutline, desktopOutline, serverOutline, addCircleOutline, listOutline, barChartOutline, peopleOutline, businessOutline, cubeOutline } from "ionicons/icons"
import { frappeRequest } from "frappe-ui"

const $router = useRouter()
const quickStats = ref([])
const modules = ref([])
const masters = ref([
  { label: "Customers", desc: "View all customers", icon: peopleOutline, cls: "icon-blue", route: "/customers" },
  { label: "Suppliers", desc: "View all suppliers", icon: businessOutline, cls: "icon-orange", route: "/suppliers" },
  { label: "Items", desc: "View all items", icon: cubeOutline, cls: "icon-teal", route: "/items" },
])

const actions = [
  { label: "ICT Transfer", icon: swapHorizontalOutline, color: "text-indigo-500", route: "/ict" },
  { label: "New Reservation", icon: waterOutline, color: "text-sky-500", route: "/reservations" },
  { label: "Purchase Orders", icon: cartOutline, color: "text-amber-500", route: "/procurement" },
  { label: "Sales Orders", icon: desktopOutline, color: "text-emerald-500", route: "/sales" },
]

onMounted(async () => {
  try {
    const d = await frappeRequest({ url: "oil_distribution.api.oil_ops.get_dashboard_kpis" })
    quickStats.value = [
      { label: "Pending Orders", value: (d.pending_purchase_orders||0)+(d.pending_sales_orders||0) },
      { label: "ICT Transfers", value: d.ict_transfers||0 },
      { label: "Active Reservations", value: d.active_reservations||0 },
    ]
    modules.value = [
      { label: "ICT Operations", desc: "Inter-company stock transfers", value: (d.ict_transfers||0)+" transfers", icon: serverOutline, cls: "icon-purple", accent: "text-purple-500", route: "/ict" },
      { label: "Reservations", desc: "Stock reservation management", value: (d.active_reservations||0)+" active", icon: waterOutline, cls: "icon-sky", accent: "text-sky-500", route: "/reservations" },
      { label: "Procurement", desc: "Purchase orders & suppliers", value: (d.pending_purchase_orders||0)+" pending", icon: cartOutline, cls: "icon-amber", accent: "text-amber-500", route: "/procurement" },
      { label: "Sales", desc: "Sales orders & customers", value: (d.pending_sales_orders||0)+" pending", icon: desktopOutline, cls: "icon-green", accent: "text-emerald-500", route: "/sales" },
    ]
  } catch(e) { console.error(e) }
})
</script>
