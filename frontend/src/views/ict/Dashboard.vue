<template>
  <ion-content>
    <div class="page anim-fade">
      <div class="hero" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)">
        <div class="flex items-center justify-between mb-3 relative z-10">
          <div>
            <div class="text-xs font-semibold tracking-wider opacity-70">ICT OPERATIONS</div>
            <div class="hero-title">Inter-Company Transfers</div>
            <div class="hero-desc">Manage stock movement between companies</div>
          </div>
          <div class="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
            <div class="text-[10px] font-semibold text-white/70">ACTIVE</div>
            <div class="text-lg font-extrabold text-white">{{ activeRoutes }}</div>
          </div>
        </div>
      </div>

      <div class="stats">
        <div v-for="(s,i) in stats" :key="i" class="stat-card anim-up" :style="{ animationDelay: i*0.07+'s' }">
          <div class="stat-icon" :class="s.cls">
            <ion-icon :icon="s.icon" />
          </div>
          <div class="stat-label">{{ s.label }}</div>
          <div class="stat-value">{{ s.value }}</div>
          <div class="text-[10px] text-gray-400 mt-1 font-medium">{{ s.sub }}</div>
        </div>
      </div>

      <div class="flex items-center gap-3 mb-4">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-sm">
          <ion-icon :icon="gitBranchOutline" class="text-white text-sm" />
        </div>
        <div>
          <div class="text-sm font-bold text-gray-900">Active Routes</div>
          <div class="text-xs text-gray-400">Configured transfer paths</div>
        </div>
      </div>

      <div v-if="routes.length" class="flex flex-col gap-2.5">
        <div v-for="(r,i) in routes" :key="r.name"
          class="bg-white rounded-xl px-4 py-3.5 border border-gray-100 shadow-sm anim-up transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          :style="{ animationDelay: i*0.06+'s', borderLeftColor: colors[i%colors.length], borderLeftWidth: '3px' }">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold text-white"
                :style="{ background: colors[i%colors.length] }">
                {{ i+1 }}
              </div>
              <div>
                <div class="text-sm font-bold text-gray-900">{{ r.name }}</div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{{ r.from_company }}</span>
                  <ion-icon :icon="arrowForwardOutline" class="text-gray-300 text-xs" />
                  <span class="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">{{ r.to_company }}</span>
                </div>
              </div>
            </div>
            <div class="text-center">
              <div class="text-sm font-extrabold text-gray-900">{{ r.total_qty }}</div>
              <div class="text-[10px] font-medium text-gray-400">units</div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="bg-white rounded-xl border border-gray-100 text-sm text-gray-400 text-center py-10 shadow-sm">No active routes configured</div>
    </div>
  </ion-content>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonContent, IonIcon } from "@ionic/vue"
import { gitBranchOutline, arrowForwardOutline, swapHorizontalOutline, trendingUpOutline, peopleOutline, shieldCheckmarkOutline } from "ionicons/icons"
import { getIctKpis, getIctRoutes } from "@/api/ict"

const colors = ["#6366f1","#8b5cf6","#a855f7","#06b6d4","#14b8a6"]
const stats = ref([])
const routes = ref([])
const activeRoutes = ref(0)

onMounted(async () => {
  try {
    const k = await getIctKpis()
    activeRoutes.value = k.active_routes || 0
    stats.value = [
      { label: "Total Transfers", value: k.total_transfers, icon: swapHorizontalOutline, cls: "icon-blue", sub: "All time" },
      { label: "Total Qty", value: k.total_qty, icon: trendingUpOutline, cls: "icon-green", sub: "Units moved" },
      { label: "Active Routes", value: k.active_routes, icon: gitBranchOutline, cls: "icon-purple", sub: "Transfer paths" },
      { label: "Total Value", value: "₹" + Number(k.total_value || 0).toLocaleString("en-IN",{maximumFractionDigits:0}), icon: shieldCheckmarkOutline, cls: "icon-amber", sub: "Cumulative" },
    ]
    routes.value = await getIctRoutes()
  } catch(e) { console.error(e) }
})
</script>
