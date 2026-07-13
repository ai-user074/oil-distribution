<template>
  <ion-card class="kpi-card">
    <ion-card-content class="ion-no-padding">
      <div class="kpi-content">
        <span class="kpi-label">{{ label }}</span>
        <div class="kpi-value-row">
          <span class="kpi-value">{{ value }}</span>
          <ion-icon v-if="icon" :name="icon" class="kpi-icon"></ion-icon>
        </div>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup>
import { IonCard, IonCardContent, IonIcon } from "@ionic/vue"

defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  icon: { type: String, default: "" },
})
</script>

<style scoped>
.kpi-card {
  margin: 0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}
.kpi-content {
  padding: 14px 16px;
}
.kpi-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}
.kpi-value-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
}
.kpi-value {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}
.kpi-icon {
  font-size: 20px;
  color: #94a3b8;
}
@media (prefers-color-scheme: dark) {
  .kpi-value { color: #f1f5f9; }
  .kpi-label { color: #94a3b8; }
  .kpi-icon { color: #64748b; }
  .kpi-card { --ion-card-background: #1e293b; }
}
</style>
