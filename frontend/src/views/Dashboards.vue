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
    <ion-content>
      <div class="page">
        <div class="page-header">
          <div class="page-title">Dashboard</div>
          <div class="page-desc">Overview of GEOperations</div>
        </div>

        <div class="stats">
          <div v-for="s in stats" :key="s.label" class="stat-card">
            <div class="stat-label">{{ s.label }}</div>
            <div class="stat-value">{{ s.value }}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Quick Actions</div>
          <div class="list-stack">
            <div v-for="a in actions" :key="a.label"
              class="list-item flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
              @click="navigate(a.path)">
              <div class="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
                <ion-icon :icon="a.icon" style="font-size:18px;color:#475569" />
              </div>
              <div>
                <div style="font-size:14px;font-weight:600;color:#0f172a">{{ a.label }}</div>
                <div style="font-size:12px;color:#94a3b8">{{ a.desc }}</div>
              </div>
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
import { swapHorizontalOutline, calendarOutline, cartOutline, cashOutline } from "ionicons/icons"

const router = useRouter()
const stats = [
  { label: "ICT Volume", value: "12,450" },
  { label: "Reserved Value", value: "₹4.2L" },
  { label: "Open POs", value: "8" },
  { label: "Open SOs", value: "6" },
]
const actions = [
  { label: "New Transfer", desc: "Inter-company stock transfer", path: "/ict", icon: swapHorizontalOutline },
  { label: "Reserve Stock", desc: "Create stock reservation", path: "/reservations", icon: calendarOutline },
  { label: "Purchase Orders", desc: "Manage procurement", path: "/procurement", icon: cartOutline },
  { label: "Sales Orders", desc: "Manage sales", path: "/sales", icon: cashOutline },
]
function navigate(p) { router.push(p) }
</script>
