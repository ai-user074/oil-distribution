<template>
  <div class="kpi-card">
    <div class="kpi-label">{{ label }}</div>
    <div class="kpi-value">{{ value }}</div>
    <div v-if="subtitle" class="kpi-subtitle">{{ subtitle }}</div>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  value: [String, Number],
  subtitle: String,
})
</script>

<style scoped>
.kpi-card {
  @apply bg-white rounded-xl p-4 shadow-sm border border-gray-100;
}
.kpi-label {
  @apply text-xs font-medium text-gray-500 uppercase tracking-wide;
}
.kpi-value {
  @apply text-2xl font-bold text-gray-900 mt-1;
}
.kpi-subtitle {
  @apply text-xs text-gray-400 mt-1;
}
</style>
