<template>
  <ion-content>
    <div class="page anim-fade">
      <div class="flex items-center justify-between mb-4">
        <div class="section-title" style="margin-bottom:0"><ion-icon :icon="waterOutline" class="text-sky-500" /> Active Reservations</div>
        <button class="btn btn-outline text-sm" @click="load"><ion-icon :icon="refreshOutline" />Refresh</button>
      </div>

      <div v-if="items.length" class="table-wrap anim-scale">
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
            <tr v-for="(item,i) in items" :key="item.name" class="anim-up" :style="{ animationDelay: i*0.03+'s' }">
              <td class="font-semibold text-sky-600">{{ item.name }}</td>
              <td>{{ item.company }}</td>
              <td>{{ item.item }}</td>
              <td>{{ item.reserved_qty }}</td>
              <td>{{ item.reserved_for || "—" }}</td>
              <td><span class="badge" :class="cls(item.status)"><ion-icon :icon="statusIcon(item.status)" style="font-size:10px" />{{ item.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="card-white text-sm text-gray-400 text-center py-10">No active reservations</div>
    </div>
  </ion-content>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonContent, IonIcon } from "@ionic/vue"
import { waterOutline, refreshOutline, checkmarkCircleOutline, timeOutline, closeCircleOutline } from "ionicons/icons"
import { getActiveReservations } from "@/api/reservations"

const items = ref([])

const cls = s => ({ Reserved: "badge-green", Released: "badge-gray", Sold: "badge-blue", Draft: "badge-amber" })[s] || "badge-gray"
const statusIcon = s => ({ Reserved: checkmarkCircleOutline, Released: closeCircleOutline, Sold: checkmarkCircleOutline, Draft: timeOutline })[s] || timeOutline
async function load() { try { items.value = await getActiveReservations(50) } catch(e) { console.error(e) } }
onMounted(load)
</script>
