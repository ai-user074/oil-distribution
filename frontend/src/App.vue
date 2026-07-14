<template>
  <ion-app>
    <ion-split-pane content-id="main-content" when="md">
      <ion-menu content-id="main-content" side="start">
        <ion-header class="ion-no-border">
          <ion-toolbar>
            <div class="sidebar-brand">
              <div class="sidebar-logo">G</div>
              <span class="sidebar-name">GEOperations</span>
            </div>
          </ion-toolbar>
        </ion-header>
        <ion-content>
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
  IonApp, IonSplitPane, IonMenu, IonHeader, IonToolbar,
  IonContent, IonList, IonItem, IonLabel, IonIcon, IonRouterOutlet,
} from "@ionic/vue"
import { useRoute } from "vue-router"
import {
  gridOutline, cartOutline, cashOutline,
  hardwareChipOutline, calendarOutline,
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
  gap: 10px;
}
.sidebar-logo {
  width: 30px;
  height: 30px;
  border-radius: 7px;
  background: #ffffff;
  color: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
}
.sidebar-name {
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
}
</style>
