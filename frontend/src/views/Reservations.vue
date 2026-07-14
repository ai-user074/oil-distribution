<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button /></ion-buttons>
        <ion-title>Stock Reservations</ion-title>
        <ion-buttons slot="end">
          <ion-button v-if="view !== 'create'" @click="view = 'create'">
            <div class="flex items-center gap-1.5 bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
              <ion-icon :icon="addOutline" class="text-sm" />New
            </div>
          </ion-button>
          <ion-button v-else @click="view = 'list'">
            <div class="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
              <ion-icon :icon="closeOutline" class="text-sm" />Cancel
            </div>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <!-- List View -->
    <ion-content v-if="view === 'list'">
      <div class="page anim-fade">
        <div class="hero" style="background:linear-gradient(135deg,#0ea5e9,#6366f1)">
          <div class="flex items-center justify-between mb-3 relative z-10">
            <div>
              <div class="text-xs font-semibold tracking-wider opacity-70">INVENTORY</div>
              <div class="hero-title">Stock Reservations</div>
              <div class="hero-desc">Track and manage reserved inventory across all companies</div>
            </div>
            <div class="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
              <div class="text-[10px] font-semibold text-white/70">ACTIVE</div>
              <div class="text-lg font-extrabold text-white">{{ activeCount }}</div>
            </div>
          </div>
        </div>

        <div class="stats">
          <div v-for="(s,i) in stats" :key="i" class="stat-card anim-up" :style="{ animationDelay: i*0.07+'s' }">
            <div class="stat-icon" :class="s.cls"><ion-icon :icon="s.icon" /></div>
            <div class="stat-label">{{ s.label }}</div>
            <div class="stat-value">{{ s.value }}</div>
            <div class="text-[10px] text-gray-400 mt-1 font-medium">{{ s.sub }}</div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-100 shadow-sm mb-4 p-3 flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2 flex-1 min-w-[140px]">
            <ion-icon :icon="filterOutline" class="text-gray-300 text-sm shrink-0" />
            <select v-model="filters.company" class="w-full text-xs font-medium text-gray-600 bg-transparent border-0 outline-none appearance-none cursor-pointer py-1" @change="load">
              <option value="All">All Companies</option>
              <option v-for="c in companies" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="w-px h-6 bg-gray-100 hidden sm:block" />
          <div class="flex items-center gap-2 flex-1 min-w-[140px]">
            <ion-icon :icon="searchOutline" class="text-gray-300 text-sm shrink-0" />
            <input v-model="filters.item" class="w-full text-xs font-medium text-gray-600 bg-transparent border-0 outline-none py-1 placeholder:text-gray-300" placeholder="Search item..." @input="load" />
          </div>
          <div class="w-px h-6 bg-gray-100 hidden sm:block" />
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-semibold text-gray-400">{{ filteredItems.length }} results</span>
            <button class="text-[10px] font-bold text-sky-500 hover:text-sky-700" @click="resetFilters">Reset</button>
          </div>
        </div>

        <div v-if="filteredItems.length" class="flex flex-col gap-2">
          <div v-for="(item,i) in filteredItems" :key="item.name"
            class="bg-white rounded-xl px-4 py-3.5 border border-gray-100 shadow-sm anim-up transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            :style="{ animationDelay: i*0.03+'s' }">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">{{ item.name }}</span>
                <span class="badge" :class="cls(item.status)">
                  <ion-icon :icon="statusIcon(item.status)" style="font-size:9px" />{{ item.status }}
                </span>
              </div>
              <div class="text-right">
                <div class="text-sm font-extrabold text-gray-900">{{ item.reserved_qty }}</div>
                <div class="text-[10px] text-gray-400">units</div>
              </div>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <span class="font-semibold text-gray-700 bg-gray-50 px-2 py-0.5 rounded-md">{{ item.company }}</span>
              <span class="text-gray-300">•</span>
              <span class="text-gray-500">{{ item.item }}</span>
              <span v-if="item.reserved_for" class="ml-auto font-semibold text-gray-500">{{ item.reserved_for }}</span>
            </div>
          </div>
        </div>
        <div v-else class="bg-white rounded-xl border border-gray-100 text-sm text-gray-400 text-center py-14 shadow-sm">
          <ion-icon :icon="waterOutline" class="text-2xl text-gray-200 mb-2" />
          <div>No reservations found</div>
        </div>
      </div>
    </ion-content>

    <!-- Create View -->
    <ion-content v-if="view === 'create'">
      <div class="page anim-fade">
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="px-5 pt-5 pb-4 border-b border-gray-50">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <ion-icon :icon="addCircleOutline" class="text-white text-lg" />
              </div>
              <div>
                <div class="text-base font-bold text-gray-900">New Reservation</div>
                <div class="text-xs text-gray-400">Reserve stock for operations</div>
              </div>
            </div>
          </div>

          <div class="px-5 pt-4 pb-5">
            <div class="flex items-center gap-2 mb-5">
              <div class="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                <div class="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500" :style="{ width: fStep+'%' }" />
              </div>
              <span class="text-[10px] font-bold text-gray-400">{{ Math.round(fStep) }}%</span>
            </div>

            <div v-if="fSection === 'company'" class="anim-fade">
              <div class="form-group">
                <label class="form-label"><ion-icon :icon="businessOutline" class="mr-1 text-sky-400" />Company</label>
                <select v-model="form.company" class="form-input">
                  <option value="" disabled>Select company</option>
                  <option v-for="c in companies" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>
            </div>

            <div v-if="fSection === 'item'" class="anim-fade">
              <div class="form-group">
                <label class="form-label"><ion-icon :icon="cubeOutline" class="mr-1 text-blue-400" />Select Item</label>
                <div class="relative">
                  <ion-icon :icon="searchOutline" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
                  <input v-model="query" class="form-input pl-9" placeholder="Search items..." @input="open=true" @focus="open=true" />
                </div>
                <div v-if="open && filtered.length" class="mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg max-h-44 overflow-y-auto">
                  <div v-for="item in filtered" :key="item.name"
                    class="flex items-center gap-3 px-3.5 py-3 text-sm hover:bg-sky-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                    @mousedown.prevent="select(item)">
                    <div class="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                      <ion-icon :icon="cubeOutline" class="text-sky-400 text-sm" />
                    </div>
                    <div>
                      <div class="font-semibold text-gray-900">{{ item.name }}</div>
                      <div class="text-xs text-gray-400">{{ item.item_name }}</div>
                    </div>
                  </div>
                </div>
                <div v-if="selected" class="mt-2 flex items-center gap-2.5 px-3.5 py-2.5 bg-sky-50 rounded-xl border border-sky-100">
                  <ion-icon :icon="checkmarkCircle" class="text-sky-400 shrink-0" />
                  <div>
                    <span class="text-sm font-semibold text-gray-900">{{ selected.name }}</span>
                    <span class="text-xs text-gray-400 ml-2">{{ selected.item_name }}</span>
                  </div>
                  <button class="ml-auto text-xs font-bold bg-white rounded-lg px-2 py-1 shadow-sm text-red-400 hover:text-red-600" @click="clearItem">Remove</button>
                </div>
              </div>
            </div>

            <div v-if="fSection === 'details'" class="anim-fade">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="form-label"><ion-icon :icon="layersOutline" class="mr-1 text-gray-400" />Quantity</label>
                  <input v-model.number="form.reserved_qty" class="form-input" type="number" min="1" />
                </div>
                <div>
                  <label class="form-label"><ion-icon :icon="optionsOutline" class="mr-1 text-amber-400" />Reserved For</label>
                  <select v-model="form.reserved_for" class="form-input">
                    <option value="" disabled>Select purpose</option>
                    <option value="Swastik">Swastik</option>
                    <option value="Sales Order">Sales Order</option>
                    <option value="Purchase Order">Purchase Order</option>
                    <option value="Work Order">Work Order</option>
                    <option value="Internal">Internal</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2.5 mt-5 pt-4 border-t border-gray-50">
              <button v-if="fSection !== 'company'" class="btn btn-outline text-sm flex-1" @click="fPrev">
                <ion-icon :icon="arrowBackOutline" /> Back
              </button>
              <button v-if="fSection !== fLast" class="btn btn-primary text-sm flex-1" style="background:linear-gradient(135deg,#0ea5e9,#6366f1)" :disabled="!fCanProceed" @click="fNext">
                Next <ion-icon :icon="arrowForwardOutline" />
              </button>
              <button v-else class="btn btn-primary text-sm flex-1" style="background:linear-gradient(135deg,#0ea5e9,#6366f1)" :disabled="saving || !fOk" @click="submit">
                <ion-icon :icon="lockClosedOutline" />
                {{ saving ? "Reserving..." : "Create Reservation" }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="fError" class="mt-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
          <ion-icon :icon="alertCircleOutline" class="text-red-400 shrink-0" />{{ fError }}
        </div>
        <div v-if="fDone" class="mt-4 bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <ion-icon :icon="checkmarkCircle" class="text-green-400 shrink-0" />{{ fDone }}
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonButton, IonIcon, IonContent } from "@ionic/vue"
import { addOutline, closeOutline, filterOutline, searchOutline, waterOutline, addCircleOutline, businessOutline, cubeOutline, layersOutline, lockClosedOutline, alertCircleOutline, checkmarkCircle, optionsOutline, arrowBackOutline, arrowForwardOutline, archiveOutline, trendingUpOutline, shieldCheckmarkOutline } from "ionicons/icons"
import { getReservationKpis, getActiveReservations, createStockReservation } from "@/api/reservations"
import { getCompanies, getItems } from "@/api/common"

// ─── List state ───
const view = ref("list")
const stats = ref([])
const activeCount = ref(0)
const allItems = ref([])
const companies = ref([])

const filters = ref({ company: "All", item: "" })

const items = ref([])
const filteredItems = computed(() => {
  let out = items.value
  if (filters.value.company !== "All") out = out.filter(i => i.company === filters.value.company)
  if (filters.value.item) {
    const q = filters.value.item.toLowerCase()
    out = out.filter(i => i.item.toLowerCase().includes(q) || i.name.toLowerCase().includes(q))
  }
  return out
})

const cls = s => ({ Reserved: "badge-green", Released: "badge-gray", Sold: "badge-blue", Draft: "badge-amber" })[s] || "badge-gray"
const statusIcon = s => ({ Reserved: checkmarkCircle, Released: closeOutline, Sold: checkmarkCircle, Draft: optionsOutline })[s] || optionsOutline
const fmt = v => "₹" + Number(v || 0).toLocaleString("en-IN",{maximumFractionDigits:0})

function resetFilters() { filters.value = { company: "All", item: "" }; load() }

// ─── Form state ───
const form = ref({ company: "", reserved_qty: 1, reserved_for: "" })
const query = ref("")
const selected = ref(null)
const open = ref(false)
const saving = ref(false)
const fError = ref("")
const fDone = ref("")

const fSection = ref("company")
const fSections = ["company", "item", "details"]
const fLast = fSections[fSections.length - 1]

const fFiltered = computed(() => {
  if (!query.value) return allItems.value.slice(0, 25)
  const q = query.value.toLowerCase()
  return allItems.value.filter(i => i.name.toLowerCase().includes(q) || (i.item_name||"").toLowerCase().includes(q)).slice(0, 30)
})
const fOk = computed(() => form.value.company && selected.value && form.value.reserved_qty > 0)
const fStep = computed(() => (fSections.indexOf(fSection.value) / (fSections.length - 1)) * 100)
const fCanProceed = computed(() => {
  if (fSection.value === "company") return form.value.company
  if (fSection.value === "item") return selected.value
  return true
})

function select(item) { selected.value = item; query.value = item.name; open.value = false }
function clearItem() { selected.value = null; query.value = "" }
function fPrev() { const i = fSections.indexOf(fSection.value); if (i > 0) fSection.value = fSections[i - 1] }
function fNext() { const i = fSections.indexOf(fSection.value); if (i < fSections.length - 1) fSection.value = fSections[i + 1] }

async function submit() {
  fError.value = ""; fDone.value = ""; saving.value = true
  try {
    const r = await createStockReservation({
      company: form.value.company,
      item: selected.value.name,
      reserved_qty: form.value.reserved_qty || 1,
      reserved_for: form.value.reserved_for,
    })
    fDone.value = `✓ ${r.name} created (${r.status})`
    setTimeout(() => { view.value = "list"; load() }, 1500)
  } catch(e) { fError.value = e.messages?.[0] || e.message || "Failed" }
  finally { saving.value = false }
}

async function load() {
  try {
    items.value = await getActiveReservations(100, filters.value.company)
  } catch(e) { console.error(e) }
}

onMounted(async () => {
  try {
    const [k, c] = await Promise.all([
      getReservationKpis(),
      getCompanies(),
      getItems(),
    ])
    activeCount.value = k.active_count || 0
    stats.value = [
      { label: "Reserved Qty", value: k.total_reserved_qty, icon: archiveOutline, cls: "icon-blue", sub: "Total units" },
      { label: "Total Value", value: fmt(k.total_reserved_value), icon: trendingUpOutline, cls: "icon-green", sub: "Cumulative" },
      { label: "Utilization", value: k.utilization_pct + "%", icon: waterOutline, cls: "icon-purple", sub: "Capacity used" },
      { label: "Active", value: k.active_count, icon: shieldCheckmarkOutline, cls: "icon-amber", sub: "Reservations" },
    ]
    companies.value = c
    allItems.value = await getItems()
    await load()
  } catch(e) { console.error(e) }
})
</script>
