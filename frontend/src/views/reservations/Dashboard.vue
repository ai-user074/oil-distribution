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
        <div class="section-title">By Company</div>
        <div v-if="byCompany.length" class="list-stack">
          <div v-for="c in byCompany" :key="c.company" class="list-item slide-up">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-900">{{ c.company }}</span>
              <div class="text-right">
                <div class="text-sm font-bold text-gray-900">{{ c.qty }}</div>
                <div class="text-xs text-gray-400">{{ fmt(c.value) }}</div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-sm text-gray-400 py-8 text-center bg-white rounded-xl border border-gray-100">No reserved stock</div>
      </div>
    </div>
  </ion-content>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonContent } from "@ionic/vue"
import { getReservationKpis, getReservedByCompany } from "@/api/reservations"

const items = ref([])
const byCompany = ref([])

function fmt(v) { return "₹" + Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 }) }

onMounted(async () => {
  try {
    const d = await getReservationKpis()
    items.value = [
      { label: "Reserved Qty", value: d.total_reserved_qty },
      { label: "Value", value: fmt(d.total_reserved_value) },
      { label: "Utilization", value: d.utilization_pct + "%" },
      { label: "Active", value: d.active_count },
    ]
    byCompany.value = await getReservedByCompany()
  } catch (e) { console.error(e) }
})
</script>
