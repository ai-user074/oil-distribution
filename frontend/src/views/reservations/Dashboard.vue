<template>
  <ion-content>
    <div class="page anim-fade">
      <div class="hero" style="background:linear-gradient(135deg,#0ea5e9,#6366f1)">
        <div class="flex items-center justify-between mb-3 relative z-10">
          <div>
            <div class="text-xs font-semibold tracking-wider opacity-70">INVENTORY</div>
            <div class="hero-title">Stock Reservations</div>
            <div class="hero-desc">Track and manage reserved inventory</div>
          </div>
          <div class="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
            <div class="text-[10px] font-semibold text-white/70">ACTIVE</div>
            <div class="text-lg font-extrabold text-white">{{ activeCount }}</div>
          </div>
        </div>
      </div>

      <div class="stats">
        <div v-for="(s,i) in stats" :key="i" class="stat-card anim-up" :style="{ animationDelay: i*0.07+'s' }">
          <div class="stat-icon" :class="s.cls"><ion-icon :icon="s.icon" /></div>
          <div class="stat-label">{{ s.label }}</div>
          <div class="stat-value">{{ s.value }}</div>
          <div class="text-[10px] text-gray-400 mt-1 font-medium">{{ s.sub }}</div>
        </div>
      </div>

      <div class="flex items-center gap-3 mb-4">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shadow-sm">
          <ion-icon :icon="layersOutline" class="text-white text-sm" />
        </div>
        <div>
          <div class="text-sm font-bold text-gray-900">Reserved by Company</div>
          <div class="text-xs text-gray-400">Breakdown across entities</div>
        </div>
      </div>

      <div v-if="byCompany.length" class="flex flex-col gap-2.5">
        <div v-for="(c,i) in byCompany" :key="c.company"
          class="bg-white rounded-xl px-4 py-3.5 border border-gray-100 shadow-sm anim-up transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          :style="{ animationDelay: i*0.06+'s' }">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-extrabold"
                :style="{ background: gradients[i%gradients.length] }">
                {{ c.company.charAt(0) }}
              </div>
              <div>
                <div class="text-sm font-bold text-gray-900">{{ c.company }}</div>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="text-xs font-medium text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">{{ c.qty }} units</span>
                </div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm font-extrabold text-gray-900">{{ fmt(c.value) }}</div>
              <div class="text-[10px] font-medium text-gray-400">value</div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="bg-white rounded-xl border border-gray-100 text-sm text-gray-400 text-center py-10 shadow-sm">No reserved stock</div>
    </div>
  </ion-content>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonContent, IonIcon } from "@ionic/vue"
import { layersOutline, waterOutline, archiveOutline, trendingUpOutline, shieldCheckmarkOutline } from "ionicons/icons"
import { getReservationKpis, getReservedByCompany } from "@/api/reservations"

const gradients = ["linear-gradient(135deg,#0ea5e9,#6366f1)","linear-gradient(135deg,#22c55e,#06b6d4)","linear-gradient(135deg,#f59e0b,#ef4444)","linear-gradient(135deg,#a855f7,#6366f1)"]
const stats = ref([])
const byCompany = ref([])
const activeCount = ref(0)

const fmt = v => "₹" + Number(v || 0).toLocaleString("en-IN",{maximumFractionDigits:0})

onMounted(async () => {
  try {
    const d = await getReservationKpis()
    activeCount.value = d.active_count || 0
    stats.value = [
      { label: "Reserved Qty", value: d.total_reserved_qty, icon: archiveOutline, cls: "icon-blue", sub: "Total units" },
      { label: "Total Value", value: fmt(d.total_reserved_value), icon: trendingUpOutline, cls: "icon-green", sub: "Cumulative" },
      { label: "Utilization", value: d.utilization_pct + "%", icon: waterOutline, cls: "icon-purple", sub: "Capacity used" },
      { label: "Active", value: d.active_count, icon: shieldCheckmarkOutline, cls: "icon-amber", sub: "Reservations" },
    ]
    byCompany.value = await getReservedByCompany()
  } catch(e) { console.error(e) }
})
</script>
