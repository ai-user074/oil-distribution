<template>
  <div class="empty-state">
    <ion-icon :name="icon" class="empty-icon"></ion-icon>
    <ion-text color="medium">
      <p class="empty-text">{{ message }}</p>
    </ion-text>
    <slot></slot>
  </div>
</template>

<script setup>
import { IonIcon, IonText } from "@ionic/vue"

defineProps({
  icon: { type: String, default: "document-outline" },
  message: { type: String, default: "No items found" },
})
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  color: #cbd5e1;
}
.empty-text {
  font-size: 14px;
  text-align: center;
  margin: 0;
}
</style>
