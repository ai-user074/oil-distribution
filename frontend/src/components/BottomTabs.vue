<template>
  <ion-tab-bar slot="bottom">
    <ion-tab-button
      v-for="tab in tabs"
      :key="tab.name"
      @click="$router.push(tab.route)"
      :class="{ 'tab-selected': $route.path === tab.route || $route.path.startsWith(tab.route + '/') }"
    >
      <ion-icon :name="tab.icon" :md="tab.icon" :ios="tab.iosIcon"></ion-icon>
      <ion-label>{{ tab.label }}</ion-label>
    </ion-tab-button>
  </ion-tab-bar>
</template>

<script setup>
import { useRoute } from "vue-router"
import { IonTabBar, IonTabButton, IonLabel, IonIcon } from "@ionic/vue"

const $route = useRoute()

const tabs = [
  { name: "home", label: "Home", icon: "home-outline", iosIcon: "home-outline", route: "/home" },
  { name: "procure", label: "Procure", icon: "cart-outline", iosIcon: "cart-outline", route: "/procurement" },
  { name: "sales", label: "Sales", icon: "trending-up-outline", iosIcon: "trending-up-outline", route: "/sales" },
  { name: "ict", label: "ICT", icon: "swap-horizontal-outline", iosIcon: "swap-horizontal-outline", route: "/ict" },
  { name: "reserve", label: "Reserve", icon: "cube-outline", iosIcon: "cube-outline", route: "/reservations" },
]
</script>

<style scoped>
.tab-selected {
  --color: var(--ion-color-primary);
  color: var(--ion-color-primary);
  --ion-tab-bar-color-selected: var(--ion-color-primary);
}
</style>
