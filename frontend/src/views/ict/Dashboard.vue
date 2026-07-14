<template>
  <ion-content scroll-y="true">
    <div class="content-pad space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <div v-for="k in kpis" :key="k.label" class="gradient-card slide-up" :class="k.color">
          <div class="icon-wrap">
            <ion-icon :icon="k.icon" style="font-size:18px" />
          </div>
          <div style="font-size:11px;font-weight:500;opacity:.8">{{ k.label }}</div>
          <div style="font-size:22px;font-weight:800;margin-top:2px">{{ k.value }}</div>
        </div>
      </div>

      <div>
        <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:10px">Routes</div>
        <div v-if="routes.length" class="space-y-2">
          <div v-for="r in routes" :key="r.company + r.to_company" class="list-item slide-up">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-gray-900">{{ r.company }}</span>
                <span class="text-blue-300 text-xs">&rarr;</span>
                <span class="text-sm font-semibold text-gray-900">{{ r.to_company }}</span>
              </div>
              <div class="text-right">
                <div class="text-sm font-bold text-gray-900">{{ r.cnt }} <span class="text-xs font-normal text-gray-400">transfers</span></div>
                <div class="text-xs text-gray-400">{{ r.qty }} qty &middot; {{ fmt(r.value) }}</div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="bg-white rounded-xl p-8 text-center border border-gray-100">
          <ion-icon :icon="swapHorizontalOutline" style="font-size:32px;color:#cbd5e1;margin-bottom:8px" />
          <p class="text-sm text-gray-400">No routes yet</p>
        </div>
      </div>
    </div>
  </ion-content>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonContent, IonIcon } from "@ionic/vue"
import { swapHorizontalOutline, cashOutline, cubeOutline, flagOutline, swapHorizontal } from "ionicons/icons"
import { getIctKpis, getIctRoutes } from "@/api/ict"

const kpis = ref([])
const routes = ref([])

function fmt(v) { return "₹" + Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 }) }

onMounted(async () => {
  try {
    const data = await getIctKpis()
    kpis.value = [
      { label: "Volume", value: data.total_volume, icon: cubeOutline, color: "grad-blue" },
      { label: "Value", value: fmt(data.ict_value), icon: cashOutline, color: "grad-green" },
      { label: "Transfers", value: data.ict_count, icon: swapHorizontalOutline, color: "grad-purple" },
      { label: "Pending", value: data.pending_icts, icon: flagOutline, color: "grad-amber" },
    ]
    routes.value = await getIctRoutes()
  } catch (e) { console.error("ICT Dashboard error:", e) }
})
</script>
