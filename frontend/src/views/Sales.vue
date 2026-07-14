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
    <ion-content>
      <div class="page">
        <div class="page-header">
          <div class="page-title">Sales</div>
          <div class="page-desc">Sales order overview</div>
        </div>

        <div class="stats">
          <div v-for="k in kpis" :key="k.label" class="stat-card">
            <div class="stat-label">{{ k.label }}</div>
            <div class="stat-value">{{ k.value }}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Pending Sales Orders</div>
          <div v-if="orders.length" class="table-wrap">
            <table>
              <thead>
                <tr><th>ID</th><th>Customer</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                <tr v-for="so in orders" :key="so.name">
                  <td class="font-semibold">{{ so.name }}</td>
                  <td>{{ so.customer }}</td>
                  <td>{{ fmt(so.total) }}</td>
                  <td><span class="badge" :class="cls(so.status)">{{ so.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="text-sm text-gray-400 py-8 text-center bg-white rounded-xl border border-gray-100">Loading...</div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton } from "@ionic/vue"
import { frappeRequest } from "frappe-ui"

const kpis = ref([])
const orders = ref([])

function fmt(v) { return "₹" + Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 }) }
function cls(s) {
  const m = { "To Deliver and Bill": "badge-amber", "Completed": "badge-green", "Closed": "badge-gray" }
  return m[s] || "badge-blue"
}

onMounted(async () => {
  try {
    const d = await frappeRequest({ url: "oil_distribution.api.oil_ops.get_sales_kpis" })
    kpis.value = [
      { label: "Total Sales", value: fmt(d.total_sales) },
      { label: "SO Count", value: d.so_count },
      { label: "Pending", value: d.pending_sos },
      { label: "Customers", value: d.customer_count },
    ]
    orders.value = await frappeRequest({ url: "oil_distribution.api.oil_ops.get_pending_sales_orders", params: { limit: 20 } })
  } catch (e) { console.error(e) }
})
</script>
