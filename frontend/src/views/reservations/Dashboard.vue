<template>
  <ion-content scroll-y="true">
    <div class="content-pad space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <div v-for="k in kpiList" :key="k.label" class="gradient-card slide-up" :class="k.color">
          <div class="icon-wrap">
            <ion-icon :icon="k.icon" style="font-size:18px" />
          </div>
          <div style="font-size:11px;font-weight:500;opacity:.8">{{ k.label }}</div>
          <div style="font-size:22px;font-weight:800;margin-top:2px">{{ k.value }}</div>
        </div>
      </div>

      <div>
        <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:10px">By Company</div>
        <div v-if="byCompany.length" class="space-y-2">
          <div v-for="c in byCompany" :key="c.company" class="list-item slide-up">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-900">{{ c.company }}</span>
              <div class="text-right">
                <div class="text-sm font-bold text-gray-900">{{ c.qty }} <span class="text-xs font-normal text-gray-400">units</span></div>
                <div class="text-xs text-gray-400">{{ fmt(c.value) }}</div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="bg-white rounded-2xl p-10 text-center border border-gray-100">
          <ion-icon :icon="cubeOutline" style="font-size:36px;color:#cbd5e1;margin-bottom:8px" />
          <p class="text-sm text-gray-400">No reserved stock</p>
        </div>
      </div>
    </div>
  </ion-content>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonContent, IonIcon } from "@ionic/vue"
import { cubeOutline, cashOutline, pieChartOutline, layersOutline } from "ionicons/icons"
import { getReservationKpis, getReservedByCompany } from "@/api/reservations"

const kpiList = ref([])
const byCompany = ref([])

function fmt(v) { return "₹" + Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 }) }

onMounted(async () => {
  try {
    const data = await getReservationKpis()
    kpiList.value = [
      { label: "Reserved Qty", value: data.total_reserved_qty, icon: cubeOutline, color: "grad-blue" },
      { label: "Value", value: fmt(data.total_reserved_value), icon: cashOutline, color: "grad-green" },
      { label: "Utilization", value: data.utilization_pct + "%", icon: pieChartOutline, color: "grad-purple" },
      { label: "Active", value: data.active_count, icon: layersOutline, color: "grad-amber" },
    ]
    byCompany.value = await getReservedByCompany()
  } catch (e) { console.error("Reservation Dashboard error:", e) }
})
</script>
