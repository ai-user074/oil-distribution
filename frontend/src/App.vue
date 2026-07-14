<template>
  <ion-app>
    <ion-split-pane content-id="main-content" when="md">
      <ion-menu content-id="main-content" side="start">
        <ion-header class="ion-no-border">
          <ion-toolbar style="--min-height:48px">
            <div class="brand">
              <div class="brand-mark">G</div>
              <div class="brand-text">
                <div class="brand-name">GEOperations</div>
              </div>
            </div>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <div class="nav-section">Main</div>
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

          <div class="nav-section" style="margin-top: 12px;">Support</div>
          <ion-list>
            <ion-item detail="false" class="help-item" @click="openReport">
              <ion-icon :icon="documentTextOutline" slot="start" />
              <ion-label>Reports</ion-label>
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
import { useRoute, useRouter } from "vue-router"
import {
  gridOutline, cartOutline, cashOutline,
  hardwareChipOutline, calendarOutline, documentTextOutline,
} from "ionicons/icons"

const route = useRoute()
const router = useRouter()

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

function openReport() {
  window.open("/app/intercompany-transfer-report", "_blank")
}
</script>

<style scoped>
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 0;
}
.brand-mark {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  box-shadow: 0 2px 6px rgba(37,99,235,0.3);
}
.brand-name {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}
.nav-section {
  font-size: 9px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 12px 14px 4px;
}
.help-item {
  --color: #94a3b8;
  font-size: 12px;
}
</style>
