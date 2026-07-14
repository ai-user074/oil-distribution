<template>
  <ion-content class="ion-padding">
    <div class="space-y-5">
      <div class="grid grid-cols-2 gap-3">
        <div v-for="k in kpiList" :key="k.label"
          class="rounded-2xl p-4 text-white" :class="k.gradient">
          <div class="text-white/80 text-xs font-medium uppercase tracking-wide">{{ k.label }}</div>
          <div class="text-2xl font-bold mt-1">{{ k.value }}</div>
        </div>
      </div>

      <div>
        <div class="section-title">Routes</div>
        <div v-if="routes.length" class="space-y-2">
          <div v-for="r in routes" :key="r.company + r.to_company" class="route-card">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-sm">
                <span class="font-semibold text-gray-900">{{ r.company }}</span>
                <span class="text-gray-300">&rarr;</span>
                <span class="font-semibold text-gray-900">{{ r.to_company }}</span>
              </div>
              <div class="text-right">
                <div class="text-sm font-bold text-gray-900">{{ r.cnt }} transfers</div>
                <div class="text-xs text-gray-400">{{ r.qty }} qty &middot; {{ fmt(r.value) }}</div>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-gray-400 text-center py-8 bg-white rounded-2xl border border-gray-100">No routes found</p>
      </div>
    </div>
  </ion-content>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonContent } from "@ionic/vue"
import { getIctKpis, getIctRoutes } from "@/api/ict"

const kpis = ref({ total_volume: 0, ict_value: 0, ict_count: 0, active_routes: 0, pending_icts: 0 })
const routes = ref([])

const kpiList = ref([])

function fmt(v) {
  return "₹" + Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })
}

onMounted(async () => {
  try {
    kpis.value = await getIctKpis()
    kpiList.value = [
      { label: "Total Volume", value: kpis.value.total_volume, gradient: "gradient-blue" },
      { label: "Total Value", value: fmt(kpis.value.ict_value), gradient: "gradient-green" },
      { label: "Transfers", value: kpis.value.ict_count, gradient: "gradient-purple" },
      { label: "Pending", value: kpis.value.pending_icts, gradient: "gradient-amber" },
    ]
    routes.value = await getIctRoutes()
  } catch (e) {
    console.error("ICT Dashboard error:", e)
  }
})
</script>
