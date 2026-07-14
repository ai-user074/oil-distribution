<template>
  <ion-app>
    <ion-split-pane content-id="main-content">
      <ion-menu content-id="main-content" side="start">
        <ion-header class="ion-no-border">
          <ion-toolbar>
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                <ion-icon :icon="waterOutline" class="text-white text-lg" />
              </div>
              <div>
                <div class="text-sm font-bold text-gray-900">GEOperations</div>
                <div class="text-[10px] font-medium text-gray-400 tracking-wide">DASHBOARD</div>
              </div>
            </div>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list>
            <ion-item v-for="n in nav" :key="n.route" :router-link="n.route" router-direction="root" :class="{ selected: $route.path === n.route }">
              <ion-icon :icon="n.icon" />
              <ion-label>{{ n.label }}</ion-label>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-menu>
      <ion-router-outlet id="main-content" />
    </ion-split-pane>
  </ion-app>
</template>

<script setup>
import { IonApp, IonSplitPane, IonMenu, IonHeader, IonToolbar, IonContent, IonList, IonItem, IonLabel, IonIcon, IonRouterOutlet } from "@ionic/vue"
import { useRoute } from "vue-router"
import { waterOutline, gridOutline, cartOutline, desktopOutline, serverOutline, pulseOutline, analyticsOutline, peopleOutline, businessOutline, cubeOutline } from "ionicons/icons"

const $route = useRoute()
const nav = [
  { route: "/", label: "Dashboard", icon: gridOutline },
  { route: "/command-center", label: "Command Center", icon: pulseOutline },
  { route: "/stock", label: "Stock Dashboard", icon: analyticsOutline },
  { route: "/procurement", label: "Procurement", icon: cartOutline },
  { route: "/sales", label: "Sales", icon: desktopOutline },
  { route: "/ict", label: "ICT", icon: serverOutline },
  { route: "/reservations", label: "Reservations", icon: waterOutline },
  { route: "/customers", label: "Customers", icon: peopleOutline },
  { route: "/suppliers", label: "Suppliers", icon: businessOutline },
  { route: "/items", label: "Items", icon: cubeOutline },
]
</script>
