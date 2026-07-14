<template>
  <ion-content scroll-y="true">
    <div class="content-pad">
      <div class="flex items-center justify-between mb-3">
        <div style="font-size:14px;font-weight:700;color:#0f172a">
          Active Reservations
          <span style="font-size:12px;font-weight:500;color:#64748b;margin-left:4px">({{ items.length }})</span>
        </div>
        <button class="btn btn-outline text-xs !py-1.5 !px-3" @click="refresh">Refresh</button>
      </div>

      <div v-if="items.length" class="space-y-2">
        <div v-for="item in items" :key="item.name" class="list-item slide-up">
          <div class="flex items-center justify-between mb-1">
            <div class="list-item-primary">{{ item.name }}</div>
            <span class="badge" :class="statusClass(item.status)">{{ item.status }}</span>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-xs text-gray-700">
                <span class="font-medium">{{ item.item }}</span>
                <span class="text-gray-400 ml-1">× {{ item.reserved_qty }}</span>
              </div>
              <div class="text-xs text-gray-400 mt-0.5">{{ item.company }}</div>
            </div>
            <div class="text-xs text-gray-500">{{ item.reserved_for || "—" }}</div>
          </div>
        </div>
      </div>

      <div v-else class="bg-white rounded-2xl p-10 text-center border border-gray-100">
        <ion-icon :icon="calendarOutline" style="font-size:40px;color:#cbd5e1;margin-bottom:10px" />
        <p class="text-sm text-gray-400 font-medium">No active reservations</p>
        <p class="text-xs text-gray-300 mt-1">Create a stock reservation to get started</p>
      </div>
    </div>
  </ion-content>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonContent, IonIcon } from "@ionic/vue"
import { calendarOutline } from "ionicons/icons"
import { getActiveReservations } from "@/api/reservations"

const items = ref([])

function statusClass(s) {
  const m = { "Reserved": "badge-green", "Released": "badge-gray", "Sold": "badge-blue", "Draft": "badge-amber" }
  return m[s] || "badge-gray"
}
async function refresh() {
  try { items.value = await getActiveReservations(50) } catch (e) { console.error(e) }
}

onMounted(refresh)
</script>
