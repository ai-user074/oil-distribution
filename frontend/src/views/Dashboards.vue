<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title>Dashboard</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="space-y-5">
        <div>
          <h2 class="text-lg font-bold text-gray-900 mb-1">Good morning, Geeta Enterprise</h2>
          <p class="text-sm text-gray-400">Here's what's happening today</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div v-for="s in stats" :key="s.label"
            class="rounded-2xl p-4 text-white" :class="s.gradient">
            <div class="text-white/80 text-xs font-medium uppercase tracking-wide">{{ s.label }}</div>
            <div class="text-2xl font-bold mt-1">{{ s.value }}</div>
            <div class="text-white/60 text-xs mt-1">{{ s.sub }}</div>
          </div>
        </div>

        <div>
          <div class="section-title">Recent Activity</div>
          <div class="bg-white rounded-2xl p-4 border border-gray-100">
            <p class="text-sm text-gray-400 text-center py-6">Activity will appear here</p>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from "@ionic/vue"

const stats = [
  { label: "Active Transfers", value: "12", sub: "3 pending review", gradient: "gradient-blue" },
  { label: "Reserved Stock", value: "45,230", sub: "1,250 units", gradient: "gradient-green" },
  { label: "Open Orders", value: "8", sub: "4 procurement, 4 sales", gradient: "gradient-amber" },
  { label: "This Month", value: "₹2.4L", sub: "+12% vs last month", gradient: "gradient-purple" },
]
</script>
