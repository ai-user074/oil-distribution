<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title>ICT</ion-title>
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
        <KPICard label="Volume" :value="formatQty(kpis?.total_volume)" icon="swap-horizontal-outline" />
        <KPICard label="Value" :value="formatCurrency(kpis?.ict_value)" icon="cash-outline" />
        <KPICard label="Routes" :value="formatQty(kpis?.active_routes)" icon="git-branch-outline" />
        <KPICard label="Pending" :value="formatQty(kpis?.pending_icts)" icon="time-outline" />
      </div>

      <!-- Active Routes -->
      <div class="content-section" v-if="routes.length">
        <p class="section-title">Active Routes</p>
        <div class="routes-grid">
          <ion-card v-for="route in routes" :key="route.company + route.to_company" class="route-card">
            <ion-card-content>
              <div class="route-header">
                <ion-chip class="route-chip">{{ abbr(route.company) }}</ion-chip>
                <ion-icon name="arrow-forward-outline" class="route-arrow"></ion-icon>
                <ion-chip class="route-chip">{{ abbr(route.to_company) }}</ion-chip>
              </div>
              <div class="route-metrics">
                <span class="route-qty">{{ formatQty(route.qty) }}</span>
                <span class="route-count">{{ route.cnt }} transfers</span>
              </div>
            </ion-card-content>
          </ion-card>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="content-section">
        <div class="action-buttons">
          <ion-button expand="block" router-link="/ict/list">
            <ion-icon slot="start" name="list-outline"></ion-icon>
            View All Transfers
          </ion-button>
          <ion-button expand="block" color="primary" router-link="/ict/new">
            <ion-icon slot="start" name="add-outline"></ion-icon>
            New Transfer
          </ion-button>
        </div>
      </div>

      <!-- Recent Transfers -->
      <div class="content-section">
        <p class="section-title">Recent Transfers</p>
        <ion-list class="inset-list" v-if="transfers.length">
          <ion-item v-for="t in transfers" :key="t.name" button @click="openDoc(t.name)">
            <ion-label>
              <div class="item-title-row">
                <span class="item-title">{{ t.name }}</span>
                <ion-badge :color="badgeColor(t.status)" class="item-badge">{{ t.status }}</ion-badge>
              </div>
              <ion-note class="item-sub">
                <ion-chip class="inline-chip">{{ abbr(t.company) }}</ion-chip>
                <ion-icon name="arrow-forward-outline" class="inline-arrow"></ion-icon>
                <ion-chip class="inline-chip">{{ abbr(t.to_company) }}</ion-chip>
                &middot; {{ formatDate(t.posting_date) }}
              </ion-note>
            </ion-label>
            <div slot="end" class="item-amount">{{ formatCurrency(t.grand_total) }}</div>
          </ion-item>
        </ion-list>
        <EmptyState v-else-if="!loading" icon="swap-horizontal-outline" message="No transfers found" />
      </div>

      <div v-if="loading" class="ion-padding ion-text-center"><ion-spinner name="crescent"></ion-spinner></div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonRefresher, IonRefresherContent, IonList, IonItem, IonLabel, IonBadge, IonNote, IonCard, IonCardContent, IonChip, IonSpinner } from "@ionic/vue"
import KPICard from "@/components/KPICard.vue"
import EmptyState from "@/components/EmptyState.vue"
import { formatCurrency, formatQty, formatDate, abbr } from "@/utils/formatters"

const kpis = ref(null)
const routes = ref([])
const transfers = ref([])
const loading = ref(false)

function badgeColor(s) {
  if (!s) return "medium"
  const str = String(s).toLowerCase()
  if (str.includes("draft") || str.includes("transfer created")) return "warning"
  if (str.includes("submit") || str.includes("completed")) return "success"
  if (str.includes("cancel")) return "danger"
  return "medium"
}

function openDoc(name) { window.open(`/desk/inter-company-transfer/${name}`, "_blank") }

async function loadData() {
  loading.value = true
  try {
    const [kpiRes, routeRes, listRes] = await Promise.all([
      frappe.call({ method: "oil_distribution.api.oil_ops.get_ict_kpis", args: { company: "All" } }),
      frappe.call({ method: "oil_distribution.api.oil_ops.get_ict_routes", args: { company: "All" } }),
      frappe.call({ method: "oil_distribution.api.oil_ops.get_ict_list", args: { company: "All", limit: 20 } }),
    ])
    kpis.value = kpiRes.message
    routes.value = routeRes.message || []
    transfers.value = listRes.message || []
  } catch (e) { console.error(e) } finally { loading.value = false }
}

function doRefresh(event) { loadData().finally(() => event.target.complete()) }
onMounted(loadData)
</script>

<style scoped>
.routes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.route-card { margin: 0; border-radius: 12px; }
.route-card ion-card-content { padding: 14px; }
.route-header { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.route-chip { margin: 0; font-size: 11px; font-weight: 700; height: 26px; background: #f1f5f9; }
.route-arrow { font-size: 14px; color: #94a3b8; }
.route-metrics { display: flex; flex-direction: column; }
.route-qty { font-size: 20px; font-weight: 700; color: #0f172a; }
.route-count { font-size: 11px; color: #94a3b8; }
.action-buttons { display: flex; flex-direction: column; gap: 8px; }
.action-buttons ion-button { margin: 0; }
.item-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 2px; }
.item-title { font-size: 14px; font-weight: 600; color: #0f172a; }
.item-badge { font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; min-height: 18px; }
.item-sub { font-size: 12px; display: flex; align-items: center; gap: 4px; margin-top: 2px; }
.inline-chip { margin: 0; font-size: 10px; font-weight: 600; height: 20px; background: #f1f5f9; }
.inline-arrow { font-size: 12px; color: #94a3b8; }
.item-amount { font-size: 14px; font-weight: 700; color: #0f172a; }
@media (prefers-color-scheme: dark) {
  .item-title { color: #f1f5f9; }
  .item-amount { color: #f1f5f9; }
  .route-qty { color: #f1f5f9; }
  .route-chip { background: #334155; }
  .inline-chip { background: #334155; }
}
</style>
