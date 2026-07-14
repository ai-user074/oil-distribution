<template>
  <ion-content>
    <div class="page">
      <div class="flex items-center justify-between mb-4">
        <div class="section-title" style="margin-bottom:0">All Transfers</div>
        <button class="btn btn-outline text-sm" @click="load">Refresh</button>
      </div>

      <div v-if="items.length" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>From</th>
              <th>To</th>
              <th>Qty</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.name">
              <td class="font-semibold">{{ item.name }}</td>
              <td>{{ item.company }}</td>
              <td>{{ item.to_company }}</td>
              <td>{{ item.total_qty }}</td>
              <td>{{ fmt(item.grand_total) }}</td>
              <td><span class="badge" :class="cls(item.status)">{{ item.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="text-sm text-gray-400 py-10 text-center bg-white rounded-xl border border-gray-100">No transfers found</div>
    </div>
  </ion-content>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonContent } from "@ionic/vue"
import { getIctList } from "@/api/ict"

const items = ref([])

function fmt(v) { return "₹" + Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 }) }
function cls(s) {
  const m = { "Submitted": "badge-green", "Transfer Created": "badge-blue", "Draft": "badge-amber", "Cancelled": "badge-gray" }
  return m[s] || "badge-gray"
}
async function load() { try { items.value = await getIctList(50) } catch (e) { console.error(e) } }
onMounted(load)
</script>
