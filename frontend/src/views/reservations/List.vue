<template>
  <ion-content>
    <div class="page anim-fade">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shadow-sm">
            <ion-icon :icon="listOutline" class="text-white text-sm" />
          </div>
          <div>
            <div class="text-sm font-bold text-gray-900">Active Reservations</div>
            <div class="text-xs text-gray-400">{{ items.length }} records</div>
          </div>
        </div>
        <button class="btn btn-outline text-xs px-3 py-2" @click="load">
          <ion-icon :icon="refreshOutline" class="text-sm" />Refresh
        </button>
      </div>

      <div v-if="items.length">
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm mb-3 px-4 py-3 flex items-center justify-between text-xs">
          <div class="flex items-center gap-4">
            <span class="text-gray-400">Total: <strong class="text-gray-700">{{ totalQty }}</strong> units</span>
            <span class="text-gray-400">Value: <strong class="text-gray-700">{{ totalAmount }}</strong></span>
          </div>
          <span class="flex items-center gap-1.5 text-gray-400">{{ items.length }} items</span>
        </div>

        <div class="flex flex-col gap-2">
          <div v-for="(item,i) in items" :key="item.name"
            class="bg-white rounded-xl px-4 py-3.5 border border-gray-100 shadow-sm anim-up transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            :style="{ animationDelay: i*0.03+'s' }">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">{{ item.name }}</span>
                <span class="badge" :class="cls(item.status)">
                  <ion-icon :icon="statusIcon(item.status)" style="font-size:9px" />{{ item.status }}
                </span>
              </div>
              <div class="text-right">
                <div class="text-sm font-extrabold text-gray-900">{{ item.reserved_qty }}</div>
                <div class="text-[10px] text-gray-400">units</div>
              </div>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <span class="font-semibold text-gray-700 bg-gray-50 px-2 py-0.5 rounded-md">{{ item.company }}</span>
              <span class="text-gray-300">•</span>
              <span class="text-gray-500">{{ item.item }}</span>
              <span v-if="item.reserved_for" class="ml-auto font-semibold text-gray-500">{{ item.reserved_for }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="bg-white rounded-xl border border-gray-100 text-sm text-gray-400 text-center py-14 shadow-sm">No active reservations</div>
    </div>
  </ion-content>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { IonContent, IonIcon } from "@ionic/vue"
import { listOutline, refreshOutline, checkmarkCircleOutline, timeOutline, closeCircleOutline } from "ionicons/icons"
import { getActiveReservations } from "@/api/reservations"

const items = ref([])

const cls = s => ({ Reserved: "badge-green", Released: "badge-gray", Sold: "badge-blue", Draft: "badge-amber" })[s] || "badge-gray"
const statusIcon = s => ({ Reserved: checkmarkCircleOutline, Released: closeCircleOutline, Sold: checkmarkCircleOutline, Draft: timeOutline })[s] || timeOutline
const fmt = v => "₹" + Number(v || 0).toLocaleString("en-IN",{maximumFractionDigits:0})
const totalQty = computed(() => items.value.reduce((a,i) => a + Number(i.reserved_qty||0), 0))
const totalAmount = computed(() => fmt(items.value.reduce((a,i) => a + Number(i.reserved_value||0), 0)))
async function load() { try { items.value = await getActiveReservations(50) } catch(e) { console.error(e) } }
onMounted(load)
</script>
