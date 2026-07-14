<template>
  <ion-app>
    <ion-router-outlet id="main-content" />
    <BottomTabs />
  </ion-app>
</template>

<script setup>
import { IonApp, IonRouterOutlet } from "@ionic/vue"
import BottomTabs from "@/components/BottomTabs.vue"
</script>
