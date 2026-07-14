<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button /></ion-buttons>
        <ion-title>Dashboard</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page anim-fade">
        <div class="hero">
          <div class="hero-title">GEOperations</div>
          <div class="hero-desc">Oil distribution operations at a glance</div>
        </div>

        <div class="stats">
          <div v-for="(s,i) in cards" :key="i" class="stat-card anim-up" :style="{ animationDelay: i*0.06+'s' }" style="cursor:pointer" @click="$router.push(s.route)">
            <div class="stat-icon" :class="s.cls"><ion-icon :icon="s.icon" /></div>
            <div class="stat-label">{{ s.label }}</div>
            <div class="stat-value text-lg">{{ s.value }}</div>
            <div class="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <ion-icon :icon="arrowForwardOutline" /> View {{ s.label }}
            </div>
          </div>
        </div>

        <div class="stack">
          <div v-for="(item,i) in shortcuts" :key="i"
            class="stack-item anim-up flex items-center gap-4" :style="{ animationDelay: (i+4)*0.05+'s' }"
            style="cursor:pointer" @click="$router.push(item.route)">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center" :class="item.cls">
              <ion-icon :icon="item.icon" class="text-lg" />
            </div>
            <div class="flex-1">
              <div class="text-sm font-semibold text-gray-900">{{ item.label }}</div>
              <div class="text-xs text-gray-400">{{ item.desc }}</div>
            </div>
            <ion-icon :icon="arrowForwardOutline" class="text-gray-300 text-sm" />
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonContent, IonMenuButton, IonIcon } from "@ionic/vue"
import { useRouter } from "vue-router"
import { cartOutline, desktopOutline, serverOutline, waterOutline, gridOutline, arrowForwardOutline, swapHorizontalOutline, trendingUpOutline, peopleOutline, shieldCheckmarkOutline } from "ionicons/icons"
import { frappeRequest } from "frappe-ui"

const $router = useRouter()
const cards = ref([])
const shortcuts = [
  { icon: swapHorizontalOutline, label: "ICT Operations", desc: "Inter-company stock transfers", route: "/ict", cls: "icon-indigo" },
  { icon: waterOutline, label: "Reservations", desc: "Stock reservation management", route: "/reservations", cls: "icon-sky" },
  { icon: cartOutline, label: "Procurement", desc: "Purchase orders & suppliers", route: "/procurement", cls: "icon-amber" },
  { icon: desktopOutline, label: "Sales", desc: "Sales orders & customers", route: "/sales", cls: "icon-green" },
]

onMounted(async () => {
  try {
    const d = await frappeRequest({ url: "oil_distribution.api.oil_ops.get_dashboard_kpis" })
    cards.value = [
      { label: "Procurement", value: d.pending_purchase_orders + " orders", icon: cartOutline, cls: "icon-amber", route: "/procurement" },
      { label: "Sales", value: d.pending_sales_orders + " orders", icon: desktopOutline, cls: "icon-green", route: "/sales" },
      { label: "ICT", value: d.ict_transfers + " transfers", icon: serverOutline, cls: "icon-purple", route: "/ict" },
      { label: "Reservations", value: d.active_reservations + " active", icon: waterOutline, cls: "icon-blue", route: "/reservations" },
    ]
  } catch(e) { console.error(e) }
})
</script>
