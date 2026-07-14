<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button />
        </ion-buttons>
        <ion-title>Sales</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="space-y-5">
        <div class="grid grid-cols-2 gap-3">
          <div v-for="k in kpis" :key="k.label"
            class="bg-white rounded-2xl p-4 border border-gray-100">
            <div class="stat-label">{{ k.label }}</div>
            <div class="stat-value mt-0.5">{{ k.value }}</div>
          </div>
        </div>

        <div>
          <div class="section-title">Pending Sales Orders</div>
          <div v-if="orders.length" class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="so in orders" :key="so.name">
                  <td class="font-medium text-gray-900">{{ so.name }}</td>
                  <td>{{ so.customer }}</td>
                  <td>{{ fmt(so.total) }}</td>
                  <td><span class="badge" :class="statusClass(so.status)">{{ so.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="text-sm text-gray-400 text-center py-8 bg-white rounded-2xl border border-gray-100">Loading...</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton } from "@ionic/vue"
import { frappeRequest } from "frappe-ui"

const kpis = ref([
  { label: "Total Sales", value: "..." },
  { label: "SO Count", value: "..." },
  { label: "Pending", value: "..." },
  { label: "Customers", value: "..." },
])
const orders = ref([])

function fmt(v) {
  return "₹" + Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })
}

function statusClass(s) {
  if (!s) return "badge-gray"
  const map = { "To Deliver and Bill": "badge-amber", "Completed": "badge-green", "Closed": "badge-gray" }
  return map[s] || "badge-blue"
}

onMounted(async () => {
  try {
    const data = await frappeRequest({ url: "oil_distribution.api.oil_ops.get_sales_kpis" })
    kpis.value = [
      { label: "Total Sales", value: fmt(data.total_sales) },
      { label: "SO Count", value: data.so_count },
      { label: "Pending", value: data.pending_sos },
      { label: "Customers", value: data.customer_count },
    ]
    orders.value = await frappeRequest({ url: "oil_distribution.api.oil_ops.get_pending_sales_orders", params: { limit: 10 } })
  } catch (e) {
    console.error("Sales error:", e)
  }
})
</script>
