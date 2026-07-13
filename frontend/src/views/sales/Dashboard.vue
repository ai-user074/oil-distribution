<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title>Sales</ion-title>
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

      <div class="kpi-grid">
        <KPICard label="Total Sales" :value="formatCurrency(kpis?.total_sales)" icon="trending-up-outline" />
        <KPICard label="Sales Orders" :value="formatQty(kpis?.so_count)" icon="document-outline" />
        <KPICard label="Pending" :value="formatQty(kpis?.pending_sos)" icon="time-outline" />
        <KPICard label="Customers" :value="formatQty(kpis?.customer_count)" icon="people-outline" />
      </div>

      <div class="content-section">
        <p class="section-title">Pending Sales Orders</p>
        <ion-list class="inset-list" v-if="pendingSOs.length">
          <ion-item v-for="so in pendingSOs" :key="so.name" button @click="openDoc('Sales Order', so.name)">
            <ion-label>
              <div class="item-title-row">
                <span class="item-title">{{ so.name }}</span>
                <ion-badge color="warning" class="item-status">Pending</ion-badge>
              </div>
              <ion-note class="item-sub">{{ so.customer }} &middot; {{ formatDate(so.transaction_date) }}</ion-note>
            </ion-label>
            <div slot="end" class="item-amount">{{ formatCurrency(so.total) }}</div>
          </ion-item>
        </ion-list>
        <EmptyState v-else-if="!loadingSOs" icon="cart-outline" message="No pending sales orders" />
      </div>

      <div class="content-section">
        <p class="section-title">Recent Deliveries</p>
        <ion-list class="inset-list" v-if="recentDNs.length">
          <ion-item v-for="dn in recentDNs" :key="dn.name" button @click="openDoc('Delivery Note', dn.name)">
            <ion-label>
              <div class="item-title-row">
                <span class="item-title">{{ dn.name }}</span>
                <ion-badge color="success" class="item-status">Delivered</ion-badge>
              </div>
              <ion-note class="item-sub">{{ dn.customer }} &middot; {{ formatDate(dn.posting_date) }}</ion-note>
            </ion-label>
            <div slot="end" class="item-amount">{{ formatCurrency(dn.total) }}</div>
          </ion-item>
        </ion-list>
        <EmptyState v-else-if="!loadingDNs" icon="document-outline" message="No recent deliveries" />
      </div>

      <div class="content-section" v-if="topCustomers.length">
        <p class="section-title">Top Customers</p>
        <ion-list class="inset-list">
          <ion-item v-for="c in topCustomers" :key="c.customer_name">
            <ion-avatar slot="start" class="customer-avatar">
              <span>{{ (c.customer_name || '?').charAt(0) }}</span>
            </ion-avatar>
            <ion-label>
              <div class="customer-name">{{ c.customer_name }}</div>
              <ion-note>{{ c.invoice_count }} orders</ion-note>
            </ion-label>
            <div slot="end" class="item-amount">{{ formatCurrency(c.total_amount) }}</div>
          </ion-item>
        </ion-list>
      </div>

      <div v-if="loadingSOs || loadingDNs" class="ion-padding ion-text-center">
        <ion-spinner name="crescent"></ion-spinner>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonRefresher, IonRefresherContent, IonList, IonItem, IonLabel, IonBadge, IonNote, IonAvatar, IonSpinner } from "@ionic/vue"
import KPICard from "@/components/KPICard.vue"
import EmptyState from "@/components/EmptyState.vue"
import { formatCurrency, formatQty, formatDate } from "@/utils/formatters"

const kpis = ref(null)
const pendingSOs = ref([])
const recentDNs = ref([])
const topCustomers = ref([])
const loadingSOs = ref(false)
const loadingDNs = ref(false)

function openDoc(doctype, name) {
  window.open(`/desk/${doctype.toLowerCase().replace(/ /g, '-')}/${name}`, "_blank")
}

async function loadData() {
  try { kpis.value = (await frappe.call({ method: "oil_distribution.api.oil_ops.get_sales_kpis", args: { company: "All" } })).message } catch (e) { console.error(e) }
  loadingSOs.value = true; try { pendingSOs.value = (await frappe.call({ method: "oil_distribution.api.oil_ops.get_pending_sales_orders", args: { company: "All", limit: 20 } })).message || [] } catch (e) { console.error(e) } finally { loadingSOs.value = false }
  loadingDNs.value = true; try { recentDNs.value = (await frappe.call({ method: "oil_distribution.api.oil_ops.get_recent_delivery_notes", args: { company: "All", limit: 20 } })).message || [] } catch (e) { console.error(e) } finally { loadingDNs.value = false }
  try { topCustomers.value = (await frappe.call({ method: "oil_distribution.api.oil_ops.get_top_customers", args: { company: "All", limit: 10 } })).message || [] } catch (e) { console.error(e) }
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
.customer-avatar { width: 36px; height: 36px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #475569; }
.customer-name { font-size: 14px; font-weight: 600; color: #0f172a; }
@media (prefers-color-scheme: dark) {
  .item-title { color: #f1f5f9; }
  .item-amount { color: #f1f5f9; }
  .customer-name { color: #f1f5f9; }
  .customer-avatar { background: #334155; color: #94a3b8; }
}
</style>
