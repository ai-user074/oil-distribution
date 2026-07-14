<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <ion-title>Reservations</ion-title>
      </ion-toolbar>
      <ion-segment :value="activeTab" @ion-change="e => activeTab = e.detail.value">
        <ion-segment-button value="dashboard">
          <ion-icon :icon="pulseOutline" />
          <ion-label>Dashboard</ion-label>
        </ion-segment-button>
        <ion-segment-button value="list">
          <ion-icon :icon="listOutline" />
          <ion-label>Active</ion-label>
        </ion-segment-button>
        <ion-segment-button value="create">
          <ion-icon :icon="addCircleOutline" />
          <ion-label>New</ion-label>
        </ion-segment-button>
      </ion-segment>
    </ion-header>

    <ResDashboard v-if="activeTab === 'dashboard'" />
    <ResList v-if="activeTab === 'list'" />
    <ResForm v-if="activeTab === 'create'" @created="activeTab = 'list'" />
  </ion-page>
</template>

<script setup>
import { ref } from "vue"
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonSegment, IonSegmentButton, IonIcon, IonLabel } from "@ionic/vue"
import { pulseOutline, listOutline, addCircleOutline } from "ionicons/icons"
import ResDashboard from "@/views/reservations/Dashboard.vue"
import ResList from "@/views/reservations/List.vue"
import ResForm from "@/views/reservations/Form.vue"

const activeTab = ref("dashboard")
</script>
