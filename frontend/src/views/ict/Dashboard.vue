<template>
  <ion-content>
    <div class="page">
      <div class="stats">
        <div v-for="k in items" :key="k.label" class="stat-card">
          <div class="stat-label">{{ k.label }}</div>
          <div class="stat-value">{{ k.value }}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Routes</div>
        <div v-if="routes.length" class="list-stack">
          <div v-for="r in routes" :key="r.company + r.to_company" class="list-item slide-up">
            <div class="flex items-center justify-between mb-0.5">
              <div class="text-sm font-semibold text-gray-900">
                {{ r.company }} <span class="text-gray-300 mx-1">&rarr;</span> {{ r.to_company }}
              </div>
              <div class="text-sm font-bold text-gray-900">{{ r.cnt }}</div>
            </div>
            <div class="text-xs text-gray-400">{{ r.qty }} qty · {{ fmt(r.value) }}</div>
          </div>
        </div>
        <div v-else class="text-sm text-gray-400 py-8 text-center bg-white rounded-xl border border-gray-100">No routes yet</div>
      </div>
    </div>
  </ion-content>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonContent } from "@ionic/vue"
import { getIctKpis, getIctRoutes } from "@/api/ict"

const items = ref([])
const routes = ref([])

function fmt(v) { return "₹" + Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 }) }

onMounted(async () => {
  try {
    const d = await getIctKpis()
    items.value = [
      { label: "Volume", value: d.total_volume },
      { label: "Value", value: fmt(d.ict_value) },
      { label: "Transfers", value: d.ict_count },
      { label: "Pending", value: d.pending_icts },
    ]
    routes.value = await getIctRoutes()
  } catch (e) { console.error(e) }
})
</script>
