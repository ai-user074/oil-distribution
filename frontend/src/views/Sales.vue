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
    <ion-content scroll-y="true">
      <div class="content-pad space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div v-for="k in kpiData" :key="k.label" class="gradient-card slide-up" :class="k.color">
            <div class="icon-wrap">
              <ion-icon :icon="k.icon" style="font-size:18px" />
            </div>
            <div style="font-size:11px;font-weight:500;opacity:.8">{{ k.label }}</div>
            <div style="font-size:22px;font-weight:800;margin-top:2px">{{ k.value }}</div>
          </div>
        </div>

        <div>
          <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:10px">
            Pending Orders
            <span style="font-size:12px;font-weight:500;color:#64748b;margin-left:6px">({{ orders.length }})</span>
          </div>
          <div v-if="orders.length" class="space-y-2">
            <div v-for="so in orders" :key="so.name" class="list-item slide-up">
              <div class="flex items-center justify-between">
                <div>
                  <div class="list-item-primary">{{ so.name }}</div>
                  <div class="list-item-secondary">{{ so.customer }}</div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-bold text-gray-900">{{ fmt(so.total) }}</div>
                  <span class="badge mt-1" :class="badgeClass(so.status)">{{ shortStatus(so.status) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="bg-white rounded-xl p-8 text-center border border-gray-100">
            <ion-icon :icon="cashOutline" style="font-size:32px;color:#cbd5e1;margin-bottom:8px" />
            <p class="text-sm text-gray-400">Loading orders...</p>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton, IonIcon } from "@ionic/vue"
import { cashOutline, bagHandleOutline, receiptOutline, peopleOutline } from "ionicons/icons"
import { frappeRequest } from "frappe-ui"

const kpiData = ref([])
const orders = ref([])

function fmt(v) { return "₹" + Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 }) }
function shortStatus(s) { return (s || "").replace("To Deliver and Bill", "Pending").replace("To Bill", "Bill") }
function badgeClass(s) {
  const m = { "To Deliver and Bill": "badge-amber", "Completed": "badge-green", "Closed": "badge-gray" }
  return m[s] || "badge-blue"
}

onMounted(async () => {
  try {
    const data = await frappeRequest({ url: "oil_distribution.api.oil_ops.get_sales_kpis" })
    kpiData.value = [
      { label: "Total Sales", value: fmt(data.total_sales), icon: cashOutline, color: "grad-green" },
      { label: "SO Count", value: data.so_count, icon: bagHandleOutline, color: "grad-blue" },
      { label: "Pending", value: data.pending_sos, icon: receiptOutline, color: "grad-amber" },
      { label: "Customers", value: data.customer_count, icon: peopleOutline, color: "grad-purple" },
    ]
    orders.value = await frappeRequest({ url: "oil_distribution.api.oil_ops.get_pending_sales_orders", params: { limit: 10 } })
  } catch (e) { console.error("Sales error:", e) }
})
</script>
