<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button /></ion-buttons>
        <ion-title>Stock Dashboard</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page anim-fade">
        <div class="hero" style="background:linear-gradient(135deg,#0ea5e9,#6366f1)">
          <div class="flex items-center justify-between mb-3 relative z-10">
            <div>
              <div class="text-xs font-semibold tracking-wider opacity-70">INVENTORY</div>
              <div class="hero-title">Stock Dashboard</div>
              <div class="hero-desc">Complete inventory overview</div>
            </div>
            <div class="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
              <div class="text-[10px] font-semibold text-white/70">ITEMS</div>
              <div class="text-lg font-extrabold text-white">{{ itemsCount }}</div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3 mt-4 relative z-10">
            <div v-for="s in quickStats" :key="s.label" class="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3">
              <div class="flex items-center gap-2 text-xs font-medium text-white/70">
                <ion-icon :icon="s.icon" class="text-sm" />{{ s.label }}
              </div>
              <div class="text-lg font-extrabold text-white mt-0.5">{{ s.value }}</div>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 mb-4">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
            <ion-icon :icon="briefcaseOutline" class="text-white text-sm" />
          </div>
          <div>
            <div class="text-sm font-bold text-gray-900">Stock by Company</div>
            <div class="text-xs text-gray-400">Available & reserved breakdown</div>
          </div>
        </div>

        <div v-if="byCompany.length" class="flex flex-col gap-2.5 mb-5">
          <div v-for="(c,i) in byCompany" :key="c.company"
            class="bg-white rounded-xl px-4 py-3.5 border border-gray-100 shadow-sm anim-up transition-all duration-200 hover:shadow-md"
            :style="{ animationDelay: i*0.06+'s' }">
            <div class="flex items-center justify-between mb-2.5">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-extrabold"
                  :style="{ background: gradients[i%gradients.length] }">{{ c.company.charAt(0) }}</div>
                <div class="text-sm font-bold text-gray-900">{{ c.company }}</div>
              </div>
              <div class="text-right">
                <div class="text-xs font-semibold text-gray-900">{{ c.item_count }} items</div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-emerald-50 rounded-lg px-3 py-2">
                <div class="text-[10px] font-semibold text-emerald-600 uppercase">Available</div>
                <div class="text-sm font-extrabold text-emerald-700">{{ c.avail_qty }}</div>
                <div class="text-[10px] text-emerald-500 font-medium">{{ fmt(c.avail_val) }}</div>
              </div>
              <div class="bg-amber-50 rounded-lg px-3 py-2">
                <div class="text-[10px] font-semibold text-amber-600 uppercase">Reserved</div>
                <div class="text-sm font-extrabold text-amber-700">{{ c.reserved_qty }}</div>
                <div class="text-[10px] text-amber-500 font-medium">{{ fmt(c.reserved_val) }}</div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="bg-white rounded-xl border border-gray-100 text-sm text-gray-400 text-center py-8 shadow-sm">No stock data</div>

        <div class="flex items-center gap-3 mb-4">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-sm">
            <ion-icon :icon="layersOutline" class="text-white text-sm" />
          </div>
          <div>
            <div class="text-sm font-bold text-gray-900">Stock by Warehouse</div>
            <div class="text-xs text-gray-400">Inventory across locations</div>
          </div>
        </div>

        <div v-if="byWarehouse.length" class="flex flex-col gap-2">
          <div v-for="(w,i) in byWarehouse" :key="w.warehouse"
            class="bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm anim-up transition-all duration-200 hover:shadow-md"
            :style="{ animationDelay: i*0.04+'s' }">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm font-semibold text-gray-900">{{ w.warehouse }}</div>
                <div class="text-xs text-gray-400">{{ w.company }} · {{ w.item_count }} items</div>
              </div>
              <div class="text-right">
                <div class="text-sm font-extrabold text-gray-900">{{ w.total_qty }}</div>
                <div class="text-[10px] font-medium text-gray-400">{{ fmt(w.total_value) }}</div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="bg-white rounded-xl border border-gray-100 text-sm text-gray-400 text-center py-8 shadow-sm">No warehouse data</div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonContent, IonMenuButton, IonIcon } from "@ionic/vue"
import { briefcaseOutline, layersOutline, archiveOutline, walletOutline, alertCircleOutline, shieldCheckmarkOutline, cubeOutline } from "ionicons/icons"
import { getStockKpis, getStockByCompany, getStockByWarehouse } from "@/api/stock"

const gradients = ["linear-gradient(135deg,#0ea5e9,#6366f1)","linear-gradient(135deg,#22c55e,#06b6d4)","linear-gradient(135deg,#f59e0b,#ef4444)"]
const quickStats = ref([])
const byCompany = ref([])
const byWarehouse = ref([])
const itemsCount = ref(0)

const fmt = v => "₹" + Number(v || 0).toLocaleString("en-IN",{maximumFractionDigits:0})

onMounted(async () => {
  try {
    const [k, c, w] = await Promise.all([
      getStockKpis(),
      getStockByCompany(),
      getStockByWarehouse(),
    ])
    itemsCount.value = k.items_count || 0
    quickStats.value = [
      { label: "Available Qty", value: k.available_qty, icon: archiveOutline },
      { label: "Reserved Qty", value: k.reserved_qty, icon: walletOutline },
      { label: "Total Value", value: fmt(k.total_value), icon: shieldCheckmarkOutline },
      { label: "Utilization", value: k.utilization_pct + "%", icon: cubeOutline },
      { label: "Items", value: k.items_count, icon: layersOutline },
      { label: "Warehouses", value: k.warehouse_count, icon: briefcaseOutline },
      { label: "Negative", value: k.negative_count, icon: alertCircleOutline },
    ]
    byCompany.value = c
    byWarehouse.value = w
  } catch(e) { console.error(e) }
})
</script>
