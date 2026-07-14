<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <ion-title>Dashboard</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content scroll-y="true">
      <div class="content-pad space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-extrabold text-gray-900">Overview</h1>
            <p class="text-sm text-gray-400 mt-0.5">Welcome back</p>
          </div>
          <div class="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-sm font-bold">GE</div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div v-for="s in stats" :key="s.label" class="gradient-card slide-up" :class="s.color">
            <div class="icon-wrap">
              <ion-icon :icon="s.icon" style="font-size:18px" />
            </div>
            <div style="font-size:11px;font-weight:500;opacity:.8;letter-spacing:.03em">{{ s.label }}</div>
            <div style="font-size:22px;font-weight:800;margin-top:2px">{{ s.value }}</div>
          </div>
        </div>

        <div>
          <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:10px">
            <ion-icon :icon="sparklesOutline" style="vertical-align:-2px;margin-right:6px;color:#2563eb" />
            Quick Actions
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div v-for="a in actions" :key="a.label"
              class="bg-white rounded-xl p-4 border border-gray-100 text-center active:scale-95 transition-transform"
              @click="navigate(a.path)">
              <ion-icon :icon="a.icon" style="font-size:22px;color:#2563eb;margin-bottom:6px" />
              <div style="font-size:12px;font-weight:600;color:#1e293b">{{ a.label }}</div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton, IonIcon,
} from "@ionic/vue"
import { useRouter } from "vue-router"
import {
  swapHorizontalOutline, calendarOutline, cartOutline, cashOutline,
  sparklesOutline,
} from "ionicons/icons"

const router = useRouter()

const stats = [
  { label: "ICT Volume", value: "12,450", color: "grad-blue", icon: swapHorizontalOutline },
  { label: "Reserved Stock", value: "₹4.2L", color: "grad-green", icon: calendarOutline },
  { label: "Open POs", value: "8", color: "grad-amber", icon: cartOutline },
  { label: "Open SOs", value: "6", color: "grad-purple", icon: cashOutline },
]

const actions = [
  { label: "New Transfer", path: "/ict", icon: swapHorizontalOutline },
  { label: "Reserve Stock", path: "/reservations", icon: calendarOutline },
  { label: "Purchase Order", path: "/procurement", icon: cartOutline },
  { label: "Sales Order", path: "/sales", icon: cashOutline },
]

function navigate(path) {
  router.push(path)
}
</script>
