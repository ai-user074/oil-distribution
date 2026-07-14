<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button /></ion-buttons>
        <ion-title>Stock Reservations</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="view = 'list'; resetForm()" v-if="view !== 'list'">
            <span class="text-xs font-semibold text-gray-500 flex items-center gap-1">
              <ion-icon :icon="arrowBackOutline" />Back
            </span>
          </ion-button>
          <ion-button @click="view = 'new'" v-else>
            <span class="text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 px-3 py-1.5 rounded-lg flex items-center gap-1">
              <ion-icon :icon="addOutline" />New Reservation
            </span>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <!-- ═══ LIST VIEW ═══ -->
    <ion-content v-if="view === 'list'">
      <div style="padding:12px 16px;">
        <!-- Filters -->
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:6px;">
            <label style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;">Company</label>
            <select v-model="filters.company" @change="load"
              style="padding:4px 24px 4px 8px;border-radius:6px;border:1px solid #e2e8f0;background:#f8fafc;color:#334155;font-size:11px;font-weight:600;appearance:none;cursor:pointer;
              background-image:url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%278%27 height=%275%27%3E%3Cpath d=%27M0 0l4 5 4-5z%27 fill=%27%2394a3b8%27/%3E%3C/svg%3E');
              background-repeat:no-repeat;background-position:right 7px center;">
              <option value="All">All Companies</option>
              <option v-for="c in companies" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <label style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;">Item</label>
            <input v-model="filters.item" @input="load" placeholder="Search item..."
              style="padding:4px 8px;border-radius:6px;border:1px solid #e2e8f0;background:#f8fafc;color:#334155;font-size:11px;font-weight:600;outline:none;width:160px;" />
          </div>
          <div style="margin-left:auto;display:flex;gap:6px;font-size:9px;font-weight:700;">
            <span v-if="items.length" style="color:#94a3b8;">{{ items.length }} reservations</span>
          </div>
        </div>

        <!-- KPIs -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px;">
          <div v-for="s in stats" :key="s.label" style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;">
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;">{{ s.label }}</div>
            <div style="font-size:18px;font-weight:800;color:#1e293b;margin-top:2px;">{{ s.value }}</div>
          </div>
        </div>

        <!-- Table -->
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;" v-if="items.length">
          <table style="width:100%;border-collapse:collapse;font-size:11px;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="text-align:left;padding:8px 10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;">ID</th>
                <th style="text-align:left;padding:8px 10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;">Company</th>
                <th style="text-align:left;padding:8px 10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;">Item</th>
                <th style="text-align:right;padding:8px 10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;">Qty</th>
                <th style="text-align:left;padding:8px 10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;">For</th>
                <th style="text-align:left;padding:8px 10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.name" style="border-top:1px solid #f1f5f9;">
                <td style="padding:8px 10px;font-weight:700;color:#1e293b;">{{ item.name }}</td>
                <td style="padding:8px 10px;color:#475569;">{{ item.company }}</td>
                <td style="padding:8px 10px;color:#64748b;">{{ item.item }}</td>
                <td style="padding:8px 10px;text-align:right;font-weight:800;color:#1e293b;">{{ item.reserved_qty }}</td>
                <td style="padding:8px 10px;color:#64748b;">{{ item.reserved_for || '—' }}</td>
                <td style="padding:8px 10px;">
                  <span :style="statusStyle(item.status)">{{ item.status }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:40px;text-align:center;color:#94a3b8;font-size:12px;">
          No reservations found
        </div>
      </div>
    </ion-content>

    <!-- ═══ NEW RESERVATION FORM ═══ -->
    <ion-content v-if="view === 'new'">
      <div style="padding:12px 16px;max-width:520px;margin:0 auto;">
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <div style="font-size:14px;font-weight:800;color:#1e293b;margin-bottom:16px;">New Reservation</div>

          <div style="margin-bottom:14px;">
            <label style="display:block;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;margin-bottom:4px;">Company</label>
            <select v-model="form.company" style="width:100%;padding:7px 28px 7px 10px;border-radius:7px;border:1px solid #e2e8f0;background:#f8fafc;color:#334155;font-size:12px;font-weight:600;appearance:none;cursor:pointer;
              background-image:url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%278%27 height=%275%27%3E%3Cpath d=%27M0 0l4 5 4-5z%27 fill=%27%2394a3b8%27/%3E%3C/svg%3E');
              background-repeat:no-repeat;background-position:right 8px center;">
              <option value="" disabled>Select company</option>
              <option v-for="c in companies" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <div style="margin-bottom:14px;">
            <label style="display:block;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;margin-bottom:4px;">Item</label>
            <div style="position:relative;">
              <input v-model="query" @focus="open = true" @input="open = true" placeholder="Search item..."
                style="width:100%;padding:7px 10px;border-radius:7px;border:1px solid #e2e8f0;background:#f8fafc;color:#334155;font-size:12px;font-weight:600;outline:none;" />
              <div v-if="open && filteredItems.length" style="position:absolute;top:100%;left:0;right:0;z-index:50;background:#fff;border:1px solid #e2e8f0;border-radius:8px;box-shadow:0 8px 24px rgba(0,20,40,0.12);max-height:200px;overflow-y:auto;margin-top:4px;">
                <div v-for="item in filteredItems" :key="item.name" @mousedown.prevent="select(item)"
                  style="padding:8px 10px;cursor:pointer;font-size:11px;font-weight:600;color:#334155;border-bottom:1px solid #f8fafc;transition:background 0.1s;"
                  @mouseenter="e => e.target.style.background='#f1f5f9'" @mouseleave="e => e.target.style.background=''">
                  <div>{{ item.name }}</div>
                  <div style="font-size:9px;color:#94a3b8;">{{ item.item_name }}</div>
                </div>
              </div>
            </div>
            <div v-if="selected" style="margin-top:6px;display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:#1e293b;padding:6px 8px;background:#eff6ff;border-radius:6px;">
              <span>✓ {{ selected.name }}</span>
              <button @click="clearItem" style="margin-left:auto;font-size:9px;color:#dc2626;background:none;border:none;cursor:pointer;font-weight:700;">Remove</button>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
            <div>
              <label style="display:block;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;margin-bottom:4px;">Quantity</label>
              <input v-model.number="form.reserved_qty" type="number" min="1"
                style="width:100%;padding:7px 10px;border-radius:7px;border:1px solid #e2e8f0;background:#f8fafc;color:#334155;font-size:12px;font-weight:600;outline:none;" />
            </div>
            <div>
              <label style="display:block;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;margin-bottom:4px;">Reserved For</label>
              <select v-model="form.reserved_for" style="width:100%;padding:7px 28px 7px 10px;border-radius:7px;border:1px solid #e2e8f0;background:#f8fafc;color:#334155;font-size:12px;font-weight:600;appearance:none;cursor:pointer;
                background-image:url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%278%27 height=%275%27%3E%3Cpath d=%27M0 0l4 5 4-5z%27 fill=%27%2394a3b8%27/%3E%3C/svg%3E');
                background-repeat:no-repeat;background-position:right 8px center;">
                <option value="" disabled>Select</option>
                <option value="Swastik">Swastik</option>
                <option value="Sales Order">Sales Order</option>
                <option value="Purchase Order">Purchase Order</option>
                <option value="Work Order">Work Order</option>
                <option value="Internal">Internal</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div style="display:flex;gap:8px;">
            <button @click="view='list';resetForm()" style="flex:1;padding:8px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:11px;font-weight:700;cursor:pointer;">Cancel</button>
            <button @click="submit" :disabled="saving || !form.company || !selected || !form.reserved_qty" style="flex:1;padding:8px;border-radius:8px;border:none;background:#3b82f6;color:#fff;font-size:11px;font-weight:700;cursor:pointer;opacity:form.company&&selected&&form.reserved_qty?1:.5;">
              {{ saving ? 'Submitting...' : 'Create Reservation' }}
            </button>
          </div>

          <div v-if="fError" style="margin-top:12px;padding:10px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;font-size:11px;color:#dc2626;font-weight:600;">{{ fError }}</div>
          <div v-if="fDone" style="margin-top:12px;padding:10px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;font-size:11px;color:#059669;font-weight:600;">✓ {{ fDone }}</div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonButton, IonIcon, IonContent } from "@ionic/vue"
import { addOutline, arrowBackOutline } from "ionicons/icons"
import { getReservationKpis, getActiveReservations, createStockReservation } from "@/api/reservations"
import { getCompanies, getItems } from "@/api/common"

const view = ref("list")

const stats = ref([])
const items = ref([])
const companies = ref([])
const allItems = ref([])

const filters = ref({ company: "All", item: "" })

const form = ref({ company: "", reserved_qty: 1, reserved_for: "" })
const query = ref("")
const selected = ref(null)
const open = ref(false)
const saving = ref(false)
const fError = ref("")
const fDone = ref("")

const filteredItems = computed(() => {
  if (!query.value) return allItems.value.slice(0, 20)
  const q = query.value.toLowerCase()
  return allItems.value.filter(i => i.name.toLowerCase().includes(q) || (i.item_name||"").toLowerCase().includes(q)).slice(0, 25)
})

const fmt = v => "₹" + Number(v || 0).toLocaleString("en-IN",{maximumFractionDigits:0})

function statusStyle(s) {
  const m = {
    Reserved: "background:#ecfdf5;color:#059669;padding:2px 7px;border-radius:20px;font-size:9px;font-weight:700;",
    Released: "background:#f8fafc;color:#94a3b8;padding:2px 7px;border-radius:20px;font-size:9px;font-weight:700;",
    Sold: "background:#eff6ff;color:#3b82f6;padding:2px 7px;border-radius:20px;font-size:9px;font-weight:700;",
    Draft: "background:#fffbeb;color:#d97706;padding:2px 7px;border-radius:20px;font-size:9px;font-weight:700;",
  }
  return m[s] || "background:#f8fafc;color:#94a3b8;padding:2px 7px;border-radius:20px;font-size:9px;font-weight:700;"
}

function select(item) { selected.value = item; query.value = item.name; open.value = false }
function clearItem() { selected.value = null; query.value = "" }
function resetForm() { form.value = { company: "", reserved_qty: 1, reserved_for: "" }; selected.value = null; query.value = ""; fError.value = ""; fDone.value = "" }

async function submit() {
  fError.value = ""; fDone.value = ""; saving.value = true
  try {
    const r = await createStockReservation({
      company: form.value.company,
      item: selected.value.name,
      reserved_qty: form.value.reserved_qty || 1,
      reserved_for: form.value.reserved_for,
    })
    fDone.value = `Reservation ${r.name} created (${r.status})`
    setTimeout(() => { view.value = "list"; resetForm(); load() }, 1500)
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
    const [k, c, i] = await Promise.all([
      getReservationKpis(),
      getCompanies(),
      getItems(),
    ])
    companies.value = c
    allItems.value = i
    stats.value = [
      { label: "Reserved Qty", value: k.total_reserved_qty },
      { label: "Total Value", value: fmt(k.total_reserved_value) },
      { label: "Utilization", value: k.utilization_pct + "%" },
      { label: "Active", value: k.active_count },
    ]
    await load()
  } catch(e) { console.error(e) }
})
</script>
