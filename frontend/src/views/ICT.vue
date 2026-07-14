<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <ion-title>ICT</ion-title>
      </ion-toolbar>
      <div class="tab-bar">
        <button v-for="t in tabs" :key="t.key"
          :class="['tab-btn', { active: activeTab === t.key }]"
          @click="activeTab = t.key">
          {{ t.label }}
        </button>
      </div>
    </ion-header>

    <IctDashboard v-if="activeTab === 'dashboard'" />
    <IctList v-if="activeTab === 'list'" />
    <IctForm v-if="activeTab === 'create'" @created="activeTab = 'list'" />
  </ion-page>
</template>

<script setup>
import { ref } from "vue"
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton } from "@ionic/vue"
import IctDashboard from "./ict/Dashboard.vue"
import IctList from "./ict/List.vue"
import IctForm from "./ict/Form.vue"

const activeTab = ref("dashboard")
const tabs = [
  { key: "dashboard", label: "Dashboard" },
  { key: "list", label: "Transfers" },
  { key: "create", label: "New Transfer" },
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
