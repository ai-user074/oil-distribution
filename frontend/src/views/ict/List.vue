<template>
  <ion-content>
    <div class="page anim-fade">
      <div class="flex items-center justify-between mb-4">
        <div class="section-title" style="margin-bottom:0"><ion-icon :icon="listOutline" class="text-indigo-500" /> Recent Transfers</div>
        <button class="btn btn-outline text-sm" @click="load"><ion-icon :icon="refreshOutline" />Refresh</button>
      </div>

      <div v-if="items.length" class="table-wrap anim-scale">
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
            <tr v-for="(item,i) in items" :key="item.name" class="anim-up" :style="{ animationDelay: i*0.03+'s' }">
              <td class="font-semibold text-indigo-600">{{ item.name }}</td>
              <td>{{ item.from_company }}</td>
              <td>{{ item.to_company }}</td>
              <td>{{ item.total_qty }}</td>
              <td>{{ fmt(item.total_amount) }}</td>
              <td><span class="badge" :class="cls(item.status)"><ion-icon :icon="statusIcon(item.status)" style="font-size:10px" />{{ item.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="card-white text-sm text-gray-400 text-center py-10">No transfers found</div>
    </div>
  </ion-content>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonContent, IonIcon } from "@ionic/vue"
import { listOutline, refreshOutline, checkmarkCircleOutline, timeOutline, closeCircleOutline } from "ionicons/icons"
import { getIctList } from "@/api/ict"

const items = ref([])

const cls = s => ({ Completed: "badge-green", Draft: "badge-amber", Cancelled: "badge-gray" })[s] || "badge-blue"
const statusIcon = s => ({ Completed: checkmarkCircleOutline, Draft: timeOutline, Cancelled: closeCircleOutline })[s] || timeOutline
const fmt = v => "₹" + Number(v || 0).toLocaleString("en-IN",{maximumFractionDigits:0})
async function load() { try { items.value = await getIctList(50) } catch(e) { console.error(e) } }
onMounted(load)
</script>
