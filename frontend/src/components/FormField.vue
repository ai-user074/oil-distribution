<template>
  <ion-item class="form-field">
    <ion-label position="stacked">{{ label }}</ion-label>
    <ion-input
      v-if="type === 'text' || type === 'number' || type === 'email'"
      :type="type"
      :value="modelValue"
      @ionInput="$emit('update:modelValue', $event.detail.value)"
      :placeholder="placeholder"
    ></ion-input>
    <ion-select
      v-else-if="type === 'select'"
      :value="modelValue"
      @ionChange="$emit('update:modelValue', $event.detail.value)"
      :placeholder="placeholder"
      interface="action-sheet"
    >
      <ion-select-option v-for="opt in options" :key="opt.value || opt" :value="opt.value || opt">
        {{ opt.label || opt }}
      </ion-select-option>
    </ion-select>
  </ion-item>
</template>

<script setup>
import { IonItem, IonLabel, IonInput, IonSelect, IonSelectOption } from "@ionic/vue"

defineProps({
  label: { type: String, required: true },
  type: { type: String, default: "text" },
  modelValue: { default: "" },
  placeholder: { type: String, default: "" },
  options: { type: Array, default: () => [] },
})
defineEmits(["update:modelValue"])
</script>

<style scoped>
.form-field {
  --padding-start: 0;
  --inner-padding-end: 0;
  --background: transparent;
}
</style>
