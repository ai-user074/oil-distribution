<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/reservations"></ion-back-button>
        </ion-buttons>
        <ion-title>All Reservations</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar :value="search" @ionInput="search = $event.detail.value" placeholder="Search reservations..." animated></ion-searchbar>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="doRefresh($event)"><ion-refresher-content></ion-refresher-content></ion-refresher>
      <ion-list class="inset-list" v-if="filtered.length">
        <ion-item v-for="r in filtered" :key="r.name" button @click="openDoc(r.name)">
          <ion-label>
            <div class="item-title-row"><span class="item-title">{{ r.item }}</span><ion-badge :color="badgeColor(r.status)" class="item-badge">{{ r.status }}</ion-badge></div>
            <ion-note class="item-sub">{{ r.name }} &middot; {{ r.company }}</ion-note>
          </ion-label>
          <div slot="end" class="item-amount">{{ formatQty(r.reserved_qty) }}</div>
        </ion-item>
      </ion-list>
      <EmptyState v-else-if="!loading" icon="cube-outline" message="No reservations found" />
      <div v-if="loading" class="ion-padding ion-text-center"><ion-spinner name="crescent"></ion-spinner></div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonSearchbar, IonContent, IonRefresher, IonRefresherContent, IonList, IonItem, IonLabel, IonBadge, IonNote, IonSpinner } from "@ionic/vue"
import EmptyState from "@/components/EmptyState.vue"
import { formatQty } from "@/utils/formatters"

const reservations = ref([])
const loading = ref(false)
const search = ref("")
const filtered = computed(() => {
  if (!search.value) return reservations.value
  const q = search.value.toLowerCase()
  return reservations.value.filter(r => r.name.toLowerCase().includes(q) || r.item.toLowerCase().includes(q) || r.company.toLowerCase().includes(q))
})

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
  try { reservations.value = (await frappe.call({ method: "oil_distribution.api.oil_ops.get_active_reservations", args: { company: "All", limit: 100 } })).message || [] } catch (e) { console.error(e) } finally { loading.value = false }
}
function doRefresh(event) { loadData().finally(() => event.target.complete()) }
onMounted(loadData)
</script>

<style scoped>
.item-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 2px; }
.item-title { font-size: 14px; font-weight: 600; color: #0f172a; }
.item-badge { font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; min-height: 18px; }
.item-sub { font-size: 12px; margin-top: 2px; }
.item-amount { font-size: 14px; font-weight: 700; color: #0f172a; }
@media (prefers-color-scheme: dark) { .item-title { color: #f1f5f9; } .item-amount { color: #f1f5f9; } }
</style>
