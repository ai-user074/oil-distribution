<template>
  <ion-content scroll-y="true">
    <div class="content-pad">
      <div class="flex items-center justify-between mb-3">
        <div style="font-size:14px;font-weight:700;color:#0f172a">
          All Transfers
          <span style="font-size:12px;font-weight:500;color:#64748b;margin-left:4px">({{ items.length }})</span>
        </div>
        <button class="btn btn-outline text-xs !py-1.5 !px-3" @click="refresh">Refresh</button>
      </div>

      <div v-if="items.length" class="space-y-2">
        <div v-for="item in items" :key="item.name" class="list-item slide-up">
          <div class="flex items-center justify-between mb-1">
            <div class="list-item-primary">{{ item.name }}</div>
            <span class="badge" :class="statusClass(item.status)">{{ shortStatus(item.status) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="text-xs text-gray-500">
              <span class="font-medium text-gray-700">{{ item.company }}</span>
              <span class="mx-1 text-gray-300">&rarr;</span>
              <span class="font-medium text-gray-700">{{ item.to_company }}</span>
            </div>
            <div class="text-right">
              <div class="text-sm font-bold text-gray-900">{{ fmt(item.grand_total) }}</div>
              <div class="text-xs text-gray-400">{{ item.total_qty }} qty · {{ item.posting_date }}</div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="bg-white rounded-2xl p-10 text-center border border-gray-100">
        <ion-icon :icon="swapHorizontalOutline" style="font-size:40px;color:#cbd5e1;margin-bottom:10px" />
        <p class="text-sm text-gray-400 font-medium">No transfers found</p>
        <p class="text-xs text-gray-300 mt-1">Create your first inter-company transfer</p>
      </div>
    </div>
  </ion-content>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonContent, IonIcon } from "@ionic/vue"
import { swapHorizontalOutline } from "ionicons/icons"
import { getIctList } from "@/api/ict"

const items = ref([])

function fmt(v) { return "₹" + Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 }) }
function shortStatus(s) {
  const m = { "Transfer Created": "Completed", "Submitted": "Submitted" }
  return m[s] || s
}
function statusClass(s) {
  const m = { "Submitted": "badge-green", "Transfer Created": "badge-blue", "Draft": "badge-amber", "Cancelled": "badge-gray" }
  return m[s] || "badge-gray"
}
async function refresh() {
  try { items.value = await getIctList(50) } catch (e) { console.error(e) }
}

onMounted(refresh)
</script>
