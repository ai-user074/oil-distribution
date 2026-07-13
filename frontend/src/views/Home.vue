<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title>Oil Operations</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="kpi-grid">
        <KPICard label="Total Spend" :value="formatCurrency(summary?.total_spend)" icon="cart-outline" />
        <KPICard label="Total Sales" :value="formatCurrency(salesSummary?.total_sales)" icon="trending-up-outline" />
        <KPICard label="ICT Volume" :value="formatQty(ictKpis?.total_volume)" icon="swap-horizontal-outline" />
        <KPICard label="Reserved" :value="formatQty(resKpis?.total_reserved_qty)" icon="cube-outline" />
      </div>

      <div class="content-section">
        <p class="section-title">Quick Actions</p>
        <div class="action-grid">
          <ion-button expand="block" fill="outline" router-link="/ict/new" class="action-btn">
            <ion-icon slot="start" name="swap-horizontal-outline"></ion-icon>
            New ICT Transfer
          </ion-button>
          <ion-button expand="block" fill="outline" router-link="/reservations/new" class="action-btn">
            <ion-icon slot="start" name="cube-outline"></ion-icon>
            New Reservation
          </ion-button>
          <ion-button expand="block" fill="outline" router-link="/procurement" class="action-btn">
            <ion-icon slot="start" name="cart-outline"></ion-icon>
            Procurement
          </ion-button>
          <ion-button expand="block" fill="outline" router-link="/sales" class="action-btn">
            <ion-icon slot="start" name="trending-up-outline"></ion-icon>
            Sales
          </ion-button>
        </div>
      </div>

      <div class="content-section" v-if="recentActivity.length">
        <p class="section-title">Recent Activity</p>
        <ion-list class="inset-list">
          <ion-item v-for="item in recentActivity" :key="item.name + item.type">
            <ion-icon :name="item.type === 'ICT' ? 'swap-horizontal-outline' : 'cube-outline'" slot="start" color="medium"></ion-icon>
            <ion-label>
              <div class="item-title-row">
                <span class="item-title">{{ item.name }}</span>
                <ion-badge :color="item.type === 'ICT' ? 'primary' : 'tertiary'" class="item-type">{{ item.type }}</ion-badge>
              </div>
              <ion-note>{{ formatDate(item.posting_date || item.creation) }}</ion-note>
            </ion-label>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonRefresher, IonRefresherContent, IonButton, IonIcon, IonList, IonItem, IonLabel, IonBadge, IonNote } from "@ionic/vue"
import KPICard from "@/components/KPICard.vue"
import { formatCurrency, formatQty, formatDate } from "@/utils/formatters"

const summary = ref({})
const salesSummary = ref({})
const ictKpis = ref({})
const resKpis = ref({})
const recentICT = ref([])
const recentReservations = ref([])

const recentActivity = computed(() => {
  const ict = recentICT.value.map(i => ({ ...i, type: "ICT" }))
  const res = recentReservations.value.map(r => ({ ...r, type: "Reservation" }))
  return [...ict, ...res].sort((a, b) => new Date(b.posting_date || b.creation) - new Date(a.posting_date || a.creation)).slice(0, 8)
})

async function loadData() {
  try {
    const [procRes, salesRes, ictRes, resRes, ictList, resList] = await Promise.all([
      frappe.call({ method: "oil_distribution.api.oil_ops.get_procurement_kpis", args: { company: "All" } }),
      frappe.call({ method: "oil_distribution.api.oil_ops.get_sales_kpis", args: { company: "All" } }),
      frappe.call({ method: "oil_distribution.api.oil_ops.get_ict_kpis", args: { company: "All" } }),
      frappe.call({ method: "oil_distribution.api.oil_ops.get_reservation_kpis", args: { company: "All" } }),
      frappe.call({ method: "oil_distribution.api.oil_ops.get_ict_list", args: { company: "All", limit: 5 } }),
      frappe.call({ method: "oil_distribution.api.oil_ops.get_active_reservations", args: { company: "All", limit: 5 } }),
    ])
    summary.value = procRes.message || {}
    salesSummary.value = salesRes.message || {}
    ictKpis.value = ictRes.message || {}
    resKpis.value = resRes.message || {}
    recentICT.value = ictList.message || []
    recentReservations.value = resList.message || []
  } catch (e) { console.error(e) }
}

function doRefresh(event) { loadData().finally(() => event.target.complete()) }
onMounted(loadData)
</script>

<style scoped>
.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.action-btn {
  margin: 0;
  --border-color: #e2e8f0;
  --color: #475569;
  font-size: 13px;
  font-weight: 500;
  min-height: 44px;
}
.item-title-row { display: flex; align-items: center; gap: 8px; }
.item-title { font-size: 14px; font-weight: 600; }
.item-type { font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; }
@media (prefers-color-scheme: dark) {
  .action-btn { --border-color: #334155; --color: #94a3b8; }
}
</style>
