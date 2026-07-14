<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <ion-title>Inter-Company Transfer</ion-title>
      </ion-toolbar>
      <ion-segment :value="activeTab" @ion-change="onTabChange">
        <ion-segment-button value="dashboard">
          <ion-icon :icon="statsChartOutline" />
          <ion-label>Dashboard</ion-label>
        </ion-segment-button>
        <ion-segment-button value="list">
          <ion-icon :icon="listOutline" />
          <ion-label>Transfers</ion-label>
        </ion-segment-button>
        <ion-segment-button value="create">
          <ion-icon :icon="addCircleOutline" />
          <ion-label>New</ion-label>
        </ion-segment-button>
      </ion-segment>
    </ion-header>

    <IctDashboard v-if="activeTab === 'dashboard'" />
    <IctList v-if="activeTab === 'list'" />
    <IctForm v-if="activeTab === 'create'" @created="onCreated" />
  </ion-page>
</template>

<script setup>
import { ref } from "vue"
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton, IonSegment, IonSegmentButton, IonIcon, IonLabel,
} from "@ionic/vue"
import { statsChartOutline, listOutline, addCircleOutline } from "ionicons/icons"
import IctDashboard from "@/views/ict/Dashboard.vue"
import IctList from "@/views/ict/List.vue"
import IctForm from "@/views/ict/Form.vue"

const activeTab = ref("dashboard")

function onTabChange(e) {
  activeTab.value = e.detail.value
}
function onCreated() {
  activeTab.value = "list"
}
</script>
