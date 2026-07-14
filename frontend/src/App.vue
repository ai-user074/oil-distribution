<template>
  <ion-app>
    <ion-split-pane content-id="main-content" when="md">
      <ion-menu content-id="main-content">
        <ion-header class="ion-no-border">
          <ion-toolbar>
            <div class="sidebar-brand">
              <div class="brand-icon">G</div>
              <div>
                <div class="brand-name">GEOperations</div>
                <div class="brand-sub">Oil Distribution</div>
              </div>
            </div>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <div class="nav-section-label">Main Menu</div>
          <ion-list>
            <ion-item
              v-for="tab in tabs"
              :key="tab.name"
              :router-link="tab.path"
              router-direction="root"
              :detail="false"
              :class="{ selected: isActive(tab.path) }"
            >
              <ion-icon :icon="tab.icon" slot="start" />
              <ion-label>{{ tab.label }}</ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-menu>

      <ion-router-outlet id="main-content" />
    </ion-split-pane>
  </ion-app>
</template>

<script setup>
import {
  IonApp,
  IonSplitPane,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonRouterOutlet,
} from "@ionic/vue"
import { useRoute } from "vue-router"
import {
  gridOutline,
  cartOutline,
  cashOutline,
  hardwareChipOutline,
  calendarOutline,
} from "ionicons/icons"

const route = useRoute()

const tabs = [
  { path: "/dashboards", label: "Dashboard", icon: gridOutline },
  { path: "/procurement", label: "Procurement", icon: cartOutline },
  { path: "/sales", label: "Sales", icon: cashOutline },
  { path: "/ict", label: "ICT", icon: hardwareChipOutline },
  { path: "/reservations", label: "Reservation", icon: calendarOutline },
]

function isActive(path) {
  return route.path.startsWith(path)
}
</script>

<style scoped>
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}
.brand-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
}
.brand-name {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}
.brand-sub {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}
.nav-section-label {
  font-size: 10px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 16px 16px 8px;
}
</style>
