<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="$emit('cancel')">
            <ion-icon name="close-outline" slot="start"></ion-icon>
            Cancel
          </ion-button>
        </ion-buttons>
        <ion-title>{{ title }}</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="!valid" @click="$emit('submit')" strong>
            <ion-icon name="checkmark-outline" slot="start"></ion-icon>
            {{ submitLabel }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="form-content">
        <slot></slot>
        <ion-note v-if="error" color="danger" class="form-error">{{ error }}</ion-note>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { IonPage, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent, IonIcon, IonNote } from "@ionic/vue"

defineProps({
  title: { type: String, default: "Form" },
  submitLabel: { type: String, default: "Save" },
  valid: { type: Boolean, default: false },
  error: { type: String, default: "" },
})
defineEmits(["submit", "cancel"])
</script>

<style scoped>
.form-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-error {
  display: block;
  padding: 0 4px;
  font-size: 13px;
}
</style>
