<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <ion-title>Reservations</ion-title>
      </ion-toolbar>
      <div class="tab-bar">
        <button v-for="t in tabs" :key="t.key"
          :class="['tab-btn', { active: activeTab === t.key }]"
          @click="activeTab = t.key">
          {{ t.label }}
        </button>
      </div>
    </ion-header>

    <ResDashboard v-if="activeTab === 'dashboard'" />
    <ResList v-if="activeTab === 'list'" />
    <ResForm v-if="activeTab === 'create'" @created="activeTab = 'list'" />
  </ion-page>
</template>

<script setup>
import { ref } from "vue"
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton } from "@ionic/vue"
import ResDashboard from "./reservations/Dashboard.vue"
import ResList from "./reservations/List.vue"
import ResForm from "./reservations/Form.vue"

const activeTab = ref("dashboard")
const tabs = [
  { key: "dashboard", label: "Dashboard" },
  { key: "list", label: "Active" },
  { key: "create", label: "New Reservation" },
]
</script>

<style scoped>
.tab-bar {
  display: flex;
  gap: 4px;
  padding: 8px 16px 0;
  background: white;
  border-bottom: 1px solid #f1f5f9;
}
.tab-btn {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #94a3b8;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
}
.tab-btn:hover {
  color: #475569;
}
.tab-btn.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
  font-weight: 600;
}
</style>
