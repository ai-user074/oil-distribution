<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button /></ion-buttons>
        <ion-title>Procurement</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page anim-fade">
        <div class="hero" style="background:linear-gradient(135deg,#f59e0b,#ef4444)">
          <div class="hero-title">Procurement</div>
          <div class="hero-desc">Purchase orders and supplier management</div>
        </div>

        <div class="stats">
          <div v-for="(s,i) in stats" :key="i" class="stat-card anim-up" :style="{ animationDelay: i*0.06+'s' }">
            <div class="stat-icon" :class="s.cls"><ion-icon :icon="s.icon" /></div>
            <div class="stat-label">{{ s.label }}</div>
            <div class="stat-value">{{ s.value }}</div>
          </div>
        </div>

        <div class="section-title"><ion-icon :icon="documentTextOutline" class="text-amber-500" /> Pending Purchase Orders</div>
        <div v-if="items.length" class="table-wrap anim-scale">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Supplier</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item,i) in items" :key="item.name" class="anim-up" :style="{ animationDelay: i*0.03+'s' }">
                <td class="font-semibold text-amber-600">{{ item.name }}</td>
                <td>{{ item.supplier }}</td>
                <td>{{ item.item }}</td>
                <td>{{ item.qty }}</td>
                <td>{{ fmt(item.amount) }}</td>
                <td><span class="badge" :class="cls(item.status)"><ion-icon :icon="statusIcon(item.status)" style="font-size:10px" />{{ item.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="card-white text-sm text-gray-400 text-center py-10">No pending purchase orders</div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonContent, IonMenuButton, IonIcon } from "@ionic/vue"
import { cartOutline, trendingUpOutline, peopleOutline, alertCircleOutline, documentTextOutline, checkmarkCircleOutline, timeOutline, closeCircleOutline } from "ionicons/icons"
import { frappeRequest } from "frappe-ui"

const stats = ref([])
const items = ref([])

const cls = s => ({ "To Receive and Bill": "badge-amber", "To Bill": "badge-blue", Completed: "badge-green", "Draft": "badge-gray" })[s] || "badge-gray"
const statusIcon = s => ({ "To Receive and Bill": timeOutline, "To Bill": timeOutline, Completed: checkmarkCircleOutline, Draft: closeCircleOutline })[s] || timeOutline
const fmt = v => "₹" + Number(v || 0).toLocaleString("en-IN",{maximumFractionDigits:0})

onMounted(async () => {
  try {
    const [k, list] = await Promise.all([
      frappeRequest({ url: "oil_distribution.api.oil_ops.get_procurement_kpis" }),
      frappeRequest({ url: "oil_distribution.api.oil_ops.get_pending_purchase_orders", params: { limit: 50 } }),
    ])
    stats.value = [
      { label: "Pending Orders", value: k.pending_orders, icon: cartOutline, cls: "icon-amber" },
      { label: "Total Qty", value: k.total_qty, icon: trendingUpOutline, cls: "icon-blue" },
      { label: "Total Amount", value: fmt(k.total_amount), icon: peopleOutline, cls: "icon-green" },
      { label: "Overdue", value: k.overdue_count, icon: alertCircleOutline, cls: "icon-rose" },
    ]
    items.value = list
  } catch(e) { console.error(e) }
})
</script>
