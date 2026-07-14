<template>
  <ion-content>
    <div class="page">
      <div class="flex items-center justify-between mb-4">
        <div class="section-title" style="margin-bottom:0">Active Reservations</div>
        <button class="btn btn-outline text-sm" @click="load">Refresh</button>
      </div>

      <div v-if="items.length" class="table-wrap">
        <table>
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
              <td class="font-semibold">{{ item.name }}</td>
              <td>{{ item.company }}</td>
              <td>{{ item.item }}</td>
              <td>{{ item.reserved_qty }}</td>
              <td>{{ item.reserved_for || "—" }}</td>
              <td><span class="badge" :class="cls(item.status)">{{ item.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="text-sm text-gray-400 py-10 text-center bg-white rounded-xl border border-gray-100">No active reservations</div>
    </div>
  </ion-content>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonContent } from "@ionic/vue"
import { getActiveReservations } from "@/api/reservations"

const items = ref([])

function cls(s) {
  const m = { "Reserved": "badge-green", "Released": "badge-gray", "Sold": "badge-blue", "Draft": "badge-amber" }
  return m[s] || "badge-gray"
}
async function load() { try { items.value = await getActiveReservations(50) } catch (e) { console.error(e) } }
onMounted(load)
</script>
