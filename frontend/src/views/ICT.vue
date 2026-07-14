<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button /></ion-buttons>
        <ion-title>ICT Operations</ion-title>
        <ion-buttons slot="end">
          <ion-button><ion-icon :icon="refreshOutline" class="text-gray-400" @click="refresh" /></ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-segment :value="tab" @ion-change="e => tab = e.detail.value">
        <ion-segment-button value="dash">
          <ion-icon :icon="pulseOutline" />Dashboard
        </ion-segment-button>
        <ion-segment-button value="list">
          <ion-icon :icon="listOutline" />Transfers
        </ion-segment-button>
        <ion-segment-button value="create">
          <ion-icon :icon="addCircleOutline" />New
        </ion-segment-button>
      </ion-segment>
    </ion-header>

    <IctDashboard v-if="tab==='dash'" />
    <IctList v-if="tab==='list'" />
    <IctForm v-if="tab==='create'" @created="tab='list'" />
  </ion-page>
</template>

<script setup>
import { ref } from "vue"
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonButton, IonIcon, IonSegment, IonSegmentButton } from "@ionic/vue"
import { pulseOutline, listOutline, addCircleOutline, refreshOutline } from "ionicons/icons"
import IctDashboard from "@/views/ict/Dashboard.vue"
import IctList from "@/views/ict/List.vue"
import IctForm from "@/views/ict/Form.vue"

const tab = ref("dash")
const refresh = () => window.location.reload()
</script>
