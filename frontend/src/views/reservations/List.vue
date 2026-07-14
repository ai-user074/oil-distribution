<template>
  <ion-content class="ion-padding">
    <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <table v-if="items.length" class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Company</th>
            <th>Item</th>
            <th>Qty</th>
            <th>For</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.name">
            <td class="font-medium text-gray-900">{{ item.name }}</td>
            <td>{{ item.company }}</td>
            <td>{{ item.item }}</td>
            <td>{{ item.reserved_qty }}</td>
            <td class="text-gray-500">{{ item.reserved_for || "—" }}</td>
            <td><span class="badge" :class="statusClass(item.status)">{{ item.status }}</span></td>
          </tr>
        </tbody>
      </table>
      <p v-else class="text-sm text-gray-400 text-center py-8">No active reservations</p>
    </div>
  </ion-content>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonContent } from "@ionic/vue"
import { getActiveReservations } from "@/api/reservations"

const items = ref([])

function statusClass(s) {
  const map = { "Reserved": "badge-green", "Released": "badge-gray", "Sold": "badge-blue", "Draft": "badge-amber" }
  return map[s] || "badge-gray"
}

onMounted(async () => {
  try {
    items.value = await getActiveReservations(50)
  } catch (e) {
    console.error("Reservation List error:", e)
  }
})
</script>
