<template>
  <ion-content>
    <div class="page anim-fade">
      <div class="hero" style="background:linear-gradient(135deg,#0ea5e9,#6366f1)">
        <div class="hero-title">Stock Reservations</div>
        <div class="hero-desc">Track and manage reserved inventory</div>
      </div>

      <div class="stats">
        <div v-for="(s,i) in stats" :key="i" class="stat-card anim-up" :style="{ animationDelay: i*0.06+'s' }">
          <div class="stat-icon" :class="s.cls"><ion-icon :icon="s.icon" /></div>
          <div class="stat-label">{{ s.label }}</div>
          <div class="stat-value">{{ s.value }}</div>
        </div>
      </div>

      <div class="section-title"><ion-icon :icon="layersOutline" class="text-sky-500" /> Reserved by Company</div>
      <div v-if="byCompany.length" class="stack">
        <div v-for="(c,i) in byCompany" :key="c.company" class="stack-item anim-up" :style="{ animationDelay: i*0.05+'s' }">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">{{ c.company.charAt(0) }}</div>
              <div>
                <div class="text-sm font-semibold text-gray-900">{{ c.company }}</div>
                <div class="text-xs text-gray-400">{{ c.qty }} units reserved</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm font-bold text-gray-900">{{ fmt(c.value) }}</div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="card-white text-sm text-gray-400 text-center py-8">No reserved stock</div>
    </div>
  </ion-content>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonContent, IonIcon } from "@ionic/vue"
import { layersOutline, waterOutline, archiveOutline, trendingUpOutline, shieldCheckmarkOutline } from "ionicons/icons"
import { getReservationKpis, getReservedByCompany } from "@/api/reservations"

const stats = ref([])
const byCompany = ref([])

const fmt = v => "₹" + Number(v || 0).toLocaleString("en-IN",{maximumFractionDigits:0})

onMounted(async () => {
  try {
    const d = await getReservationKpis()
    stats.value = [
      { label: "Reserved Qty", value: d.total_reserved_qty, icon: archiveOutline, cls: "icon-blue" },
      { label: "Total Value", value: fmt(d.total_reserved_value), icon: trendingUpOutline, cls: "icon-green" },
      { label: "Utilization", value: d.utilization_pct + "%", icon: waterOutline, cls: "icon-purple" },
      { label: "Active", value: d.active_count, icon: shieldCheckmarkOutline, cls: "icon-amber" },
    ]
    byCompany.value = await getReservedByCompany()
  } catch(e) { console.error(e) }
})
</script>
