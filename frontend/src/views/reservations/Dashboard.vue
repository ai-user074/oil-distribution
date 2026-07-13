<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title>Stock Reservations</ion-title>
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
        <KPICard label="Reserved Qty" :value="formatQty(kpis?.total_reserved_qty)" icon="cube-outline" />
        <KPICard label="Value" :value="formatCurrency(kpis?.total_reserved_value)" icon="cash-outline" />
        <KPICard label="Utilization" :value="(kpis?.utilization_pct || 0) + '%'" icon="speedometer-outline" />
        <KPICard label="Active" :value="formatQty(kpis?.active_count)" icon="checkmark-circle-outline" />
      </div>

      <div class="content-section" v-if="byCompany.length">
        <p class="section-title">Reserved by Company</p>
        <div class="company-grid">
          <ion-card v-for="(item, i) in byCompany" :key="i" class="company-card">
            <ion-card-content>
              <div class="company-header">
                <ion-avatar class="company-avatar" :style="{ background: COMPANY_COLORS[i] }">
                  <span>{{ abbr(item.company) }}</span>
                </ion-avatar>
                <span class="company-name">{{ item.company }}</span>
              </div>
              <div class="company-metrics">
                <div class="metric"><span class="metric-label">Qty</span><span class="metric-value">{{ formatQty(item.qty) }}</span></div>
                <div class="metric"><span class="metric-label">Value</span><span class="metric-value">{{ formatCurrency(item.value) }}</span></div>
              </div>
            </ion-card-content>
          </ion-card>
        </div>
      </div>

      <div class="content-section">
        <div class="action-buttons">
          <ion-button expand="block" fill="outline" router-link="/reservations/list">
            <ion-icon slot="start" name="list-outline"></ion-icon> View All Reservations
          </ion-button>
          <ion-button expand="block" router-link="/reservations/new">
            <ion-icon slot="start" name="add-outline"></ion-icon> New Reservation
          </ion-button>
        </div>
      </div>

      <div class="content-section">
        <p class="section-title">Active Reservations</p>
        <ion-list class="inset-list" v-if="reservations.length">
          <ion-item v-for="r in reservations" :key="r.name" button @click="openDoc(r.name)">
            <ion-label>
              <div class="item-title-row">
                <span class="item-title">{{ r.item }}</span>
                <ion-badge :color="badgeColor(r.status)" class="item-badge">{{ r.status }}</ion-badge>
              </div>
              <ion-note class="item-sub">{{ r.name }} &middot; {{ r.company }}</ion-note>
            </ion-label>
            <div slot="end" class="item-amount">{{ formatQty(r.reserved_qty) }}</div>
          </ion-item>
        </ion-list>
        <EmptyState v-else-if="!loading" icon="cube-outline" message="No active reservations" />
      </div>

      <div v-if="loading" class="ion-padding ion-text-center"><ion-spinner name="crescent"></ion-spinner></div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonRefresher, IonRefresherContent, IonList, IonItem, IonLabel, IonBadge, IonNote, IonCard, IonCardContent, IonAvatar, IonSpinner } from "@ionic/vue"
import KPICard from "@/components/KPICard.vue"
import EmptyState from "@/components/EmptyState.vue"
import { formatCurrency, formatQty, abbr, COMPANY_COLORS } from "@/utils/formatters"

const kpis = ref(null)
const byCompany = ref([])
const reservations = ref([])
const loading = ref(false)

function badgeColor(s) {
  if (!s) return "medium"
  const str = String(s).toLowerCase()
  if (str.includes("draft")) return "warning"
  if (str.includes("reserved")) return "success"
  if (str.includes("release") || str.includes("cancel")) return "danger"
  return "medium"
}
function openDoc(name) { window.open(`/desk/stock-reservation/${name}`, "_blank") }

async function loadData() {
  loading.value = true
  try {
    const [kpiRes, compRes, listRes] = await Promise.all([
      frappe.call({ method: "oil_distribution.api.oil_ops.get_reservation_kpis", args: { company: "All" } }),
      frappe.call({ method: "oil_distribution.api.oil_ops.get_reserved_by_company", args: {} }),
      frappe.call({ method: "oil_distribution.api.oil_ops.get_active_reservations", args: { company: "All", limit: 20 } }),
    ])
    kpis.value = kpiRes.message
    byCompany.value = compRes.message || []
    reservations.value = listRes.message || []
  } catch (e) { console.error(e) } finally { loading.value = false }
}
function doRefresh(event) { loadData().finally(() => event.target.complete()) }
onMounted(loadData)
</script>

<style scoped>
.company-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.company-card { margin: 0; border-radius: 12px; }
.company-card ion-card-content { padding: 14px; }
.company-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.company-avatar { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; color: #fff; border-radius: 8px; }
.company-name { font-size: 14px; font-weight: 600; }
.company-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.metric { display: flex; flex-direction: column; }
.metric-label { font-size: 11px; color: #94a3b8; }
.metric-value { font-size: 16px; font-weight: 700; color: #0f172a; }
.action-buttons { display: flex; flex-direction: column; gap: 8px; }
.action-buttons ion-button { margin: 0; }
.item-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 2px; }
.item-title { font-size: 14px; font-weight: 600; color: #0f172a; }
.item-badge { font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; min-height: 18px; }
.item-sub { font-size: 12px; margin-top: 2px; }
.item-amount { font-size: 14px; font-weight: 700; color: #0f172a; }
@media (prefers-color-scheme: dark) {
  .item-title { color: #f1f5f9; }
  .item-amount { color: #f1f5f9; }
  .metric-value { color: #f1f5f9; }
}
</style>
