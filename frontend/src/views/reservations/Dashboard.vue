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
        <div class="section-title">Reserved by Company</div>
        <div v-if="byCompany.length" class="space-y-2">
          <div v-for="c in byCompany" :key="c.company" class="route-card">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-sm text-gray-900">{{ c.company }}</span>
              <div class="text-right">
                <div class="text-sm font-bold text-gray-900">{{ c.qty }} units</div>
                <div class="text-xs text-gray-400">{{ fmt(c.value) }}</div>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="text-sm text-gray-400 text-center py-8 bg-white rounded-2xl border border-gray-100">No reservations</p>
      </div>
    </div>
  </ion-content>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonContent } from "@ionic/vue"
import { getReservationKpis, getReservedByCompany } from "@/api/reservations"

const kpis = ref({ total_reserved_qty: 0, total_reserved_value: 0, utilization_pct: 0, active_count: 0 })
const byCompany = ref([])
const kpiList = ref([])

function fmt(v) {
  return "₹" + Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })
}

onMounted(async () => {
  try {
    kpis.value = await getReservationKpis()
    kpiList.value = [
      { label: "Reserved Qty", value: kpis.value.total_reserved_qty, gradient: "gradient-blue" },
      { label: "Reserved Value", value: fmt(kpis.value.total_reserved_value), gradient: "gradient-green" },
      { label: "Utilization", value: kpis.value.utilization_pct + "%", gradient: "gradient-purple" },
      { label: "Active", value: kpis.value.active_count, gradient: "gradient-amber" },
    ]
    byCompany.value = await getReservedByCompany()
  } catch (e) {
    console.error("Reservation Dashboard error:", e)
  }
})
</script>
