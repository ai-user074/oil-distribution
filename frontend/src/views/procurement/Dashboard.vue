<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title>Procurement</ion-title>
        <ion-buttons slot="end">
          <ion-button router-link="/home" router-direction="root">
            <ion-icon slot="icon-only" name="home-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="doRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- KPI Grid -->
      <div class="kpi-grid">
        <KPICard label="Total Spend" :value="formatCurrency(kpis?.total_spend)" icon="cart-outline" />
        <KPICard label="Purchase Orders" :value="formatQty(kpis?.po_count)" icon="document-outline" />
        <KPICard label="Pending" :value="formatQty(kpis?.pending_pos)" icon="time-outline" />
        <KPICard label="Suppliers" :value="formatQty(kpis?.supplier_count)" icon="people-outline" />
      </div>

      <!-- Pending Purchase Orders -->
      <div class="content-section">
        <p class="section-title">Pending Purchase Orders</p>
        <ion-list class="inset-list" v-if="pendingPOs.length">
          <ion-item v-for="po in pendingPOs" :key="po.name" button @click="openDoc('Purchase Order', po.name)">
            <ion-label>
              <div class="item-title-row">
                <span class="item-title">{{ po.name }}</span>
                <ion-badge color="warning" class="item-status">Pending</ion-badge>
              </div>
              <ion-note class="item-sub">{{ po.supplier }} &middot; {{ formatDate(po.transaction_date) }}</ion-note>
            </ion-label>
            <div slot="end" class="item-amount">{{ formatCurrency(po.total) }}</div>
          </ion-item>
        </ion-list>
        <EmptyState v-else-if="!loadingPOs" icon="cart-outline" message="No pending purchase orders" />
      </div>

      <!-- Recent Purchase Receipts -->
      <div class="content-section">
        <p class="section-title">Recent Purchase Receipts</p>
        <ion-list class="inset-list" v-if="recentPRs.length">
          <ion-item v-for="pr in recentPRs" :key="pr.name" button @click="openDoc('Purchase Receipt', pr.name)">
            <ion-label>
              <div class="item-title-row">
                <span class="item-title">{{ pr.name }}</span>
                <ion-badge color="success" class="item-status">Received</ion-badge>
              </div>
              <ion-note class="item-sub">{{ pr.supplier }} &middot; {{ formatDate(pr.posting_date) }}</ion-note>
            </ion-label>
            <div slot="end" class="item-amount">{{ formatCurrency(pr.total) }}</div>
          </ion-item>
        </ion-list>
        <EmptyState v-else-if="!loadingPRs" icon="document-outline" message="No recent receipts" />
      </div>

      <div v-if="loadingPOs || loadingPRs" class="ion-padding ion-text-center">
        <ion-spinner name="crescent"></ion-spinner>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonRefresher, IonRefresherContent, IonList, IonItem, IonLabel, IonBadge, IonNote, IonSpinner } from "@ionic/vue"
import KPICard from "@/components/KPICard.vue"
import EmptyState from "@/components/EmptyState.vue"
import { formatCurrency, formatQty, formatDate } from "@/utils/formatters"

const kpis = ref(null)
const pendingPOs = ref([])
const recentPRs = ref([])
const loadingPOs = ref(false)
const loadingPRs = ref(false)

function openDoc(doctype, name) {
  window.open(`/desk/${doctype.toLowerCase().replace(/ /g, '-')}/${name}`, "_blank")
}

async function loadData() {
  try {
    kpis.value = (await frappe.call({ method: "oil_distribution.api.oil_ops.get_procurement_kpis", args: { company: "All" } })).message
  } catch (e) { console.error(e) }
  loadingPOs.value = true
  try { pendingPOs.value = (await frappe.call({ method: "oil_distribution.api.oil_ops.get_pending_purchase_orders", args: { company: "All", limit: 20 } })).message || [] } catch (e) { console.error(e) } finally { loadingPOs.value = false }
  loadingPRs.value = true
  try { recentPRs.value = (await frappe.call({ method: "oil_distribution.api.oil_ops.get_recent_purchase_receipts", args: { company: "All", limit: 20 } })).message || [] } catch (e) { console.error(e) } finally { loadingPRs.value = false }
}

function doRefresh(event) { loadData().finally(() => event.target.complete()) }
onMounted(loadData)
</script>

<style scoped>
.item-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 2px; }
.item-title { font-size: 14px; font-weight: 600; color: #0f172a; }
.item-status { font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; min-height: 18px; }
.item-sub { font-size: 12px; margin-top: 2px; }
.item-amount { font-size: 14px; font-weight: 700; color: #0f172a; }
@media (prefers-color-scheme: dark) {
  .item-title { color: #f1f5f9; }
  .item-amount { color: #f1f5f9; }
}
</style>
