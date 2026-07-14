<template>
  <ion-content class="ion-padding">
    <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <table v-if="items.length" class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>From</th>
            <th>To</th>
            <th>Qty</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.name">
            <td class="font-medium text-gray-900">{{ item.name }}</td>
            <td>{{ item.company }}</td>
            <td>{{ item.to_company }}</td>
            <td>{{ item.total_qty }}</td>
            <td>{{ fmt(item.grand_total) }}</td>
            <td class="text-gray-400 text-xs">{{ item.posting_date }}</td>
            <td><span class="badge" :class="statusClass(item.status)">{{ item.status }}</span></td>
          </tr>
        </tbody>
      </table>
      <p v-else class="text-sm text-gray-400 text-center py-8">No transfers found</p>
    </div>
  </ion-content>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonContent } from "@ionic/vue"
import { getIctList } from "@/api/ict"

const items = ref([])

function fmt(v) {
  return "₹" + Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })
}

function statusClass(s) {
  const map = { "Submitted": "badge-green", "Transfer Created": "badge-blue", "Draft": "badge-amber", "Cancelled": "badge-gray" }
  return map[s] || "badge-gray"
}

onMounted(async () => {
  try {
    items.value = await getIctList(50)
  } catch (e) {
    console.error("ICT List error:", e)
  }
})
</script>
