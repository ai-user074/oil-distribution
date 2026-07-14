<template>
  <ion-app>
    <ion-split-pane content-id="main-content" when="lg">
      <ion-menu content-id="main-content">
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title>GEOperations</ion-title>
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
  IonApp,
  IonSplitPane,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
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
ion-item.selected {
  --background: var(--ion-color-primary-tint);
  --color: var(--ion-color-primary-contrast);
  font-weight: 600;
}
</style>
