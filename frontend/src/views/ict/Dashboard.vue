<template>
  <ion-content>
    <div class="page anim-fade">
      <div class="hero">
        <div class="hero-title">Inter-Company Transfers</div>
        <div class="hero-desc">Manage stock transfers between companies</div>
      </div>

      <div class="stats">
        <div v-for="(s,i) in stats" :key="i" class="stat-card anim-up" :style="{ animationDelay: i*0.06+'s' }">
          <div class="stat-icon" :class="s.cls"><ion-icon :icon="s.icon" /></div>
          <div class="stat-label">{{ s.label }}</div>
          <div class="stat-value">{{ s.value }}</div>
        </div>
      </div>

      <div class="section-title"><ion-icon :icon="gitBranchOutline" class="text-indigo-500" /> Active Routes</div>
      <div v-if="routes.length" class="stack">
        <div v-for="(r,i) in routes" :key="r.name" class="stack-item anim-up" :style="{ animationDelay: i*0.05+'s' }">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="text-xs font-bold text-gray-400">#{{ i+1 }}</div>
              <div>
                <div class="text-sm font-semibold text-gray-900">{{ r.name }}</div>
                <div class="text-xs text-gray-400 mt-0.5">{{ r.from_company }} → {{ r.to_company }}</div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-sm font-bold text-gray-900">{{ r.total_qty }}</span>
              <ion-icon :icon="chevronForwardOutline" class="text-gray-300 text-sm" />
            </div>
          </div>
        </div>
      </div>
      <div v-else class="card-white text-sm text-gray-400 text-center py-8">No active routes</div>
    </div>
  </ion-content>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonContent, IonIcon } from "@ionic/vue"
import { gitBranchOutline, chevronForwardOutline, trendingUpOutline, swapHorizontalOutline, peopleOutline, shieldCheckmarkOutline } from "ionicons/icons"
import { getIctKpis, getIctRoutes } from "@/api/ict"

const stats = ref([])
const routes = ref([])

onMounted(async () => {
  try {
    const k = await getIctKpis()
    stats.value = [
      { label: "Total Transfers", value: k.total_transfers, icon: swapHorizontalOutline, cls: "icon-blue" },
      { label: "Total Qty", value: k.total_qty, icon: trendingUpOutline, cls: "icon-green" },
      { label: "Active Routes", value: k.active_routes, icon: gitBranchOutline, cls: "icon-purple" },
      { label: "Total Value", value: "₹" + Number(k.total_value || 0).toLocaleString("en-IN",{maximumFractionDigits:0}), icon: shieldCheckmarkOutline, cls: "icon-amber" },
    ]
    routes.value = await getIctRoutes()
  } catch(e) { console.error(e) }
})
</script>
