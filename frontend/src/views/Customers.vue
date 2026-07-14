<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button /></ion-buttons>
        <ion-title>Customers</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div style="padding:12px 16px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:6px;flex:1;">
            <input v-model="q" @input="onSearch" placeholder="Search by name, type, territory..."
              style="width:100%;max-width:320px;padding:6px 10px;border-radius:7px;border:1px solid #e2e8f0;background:#f8fafc;color:#334155;font-size:11px;font-weight:600;outline:none;" />
          </div>
          <div style="display:flex;gap:6px;font-size:9px;font-weight:700;">
            <span style="color:#94a3b8;">{{ filtered.length }} customers</span>
          </div>
        </div>
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;" v-if="filtered.length">
          <table style="width:100%;border-collapse:collapse;font-size:11px;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="text-align:left;padding:8px 10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;cursor:pointer;" @click="sort('name')">Name <span v-if="sortBy==='name'">{{ sortDir==='asc'?'\u25B2':'\u25BC' }}</span></th>
                <th style="text-align:left;padding:8px 10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;cursor:pointer;" @click="sort('customer_name')">Customer Name <span v-if="sortBy==='customer_name'">{{ sortDir==='asc'?'\u25B2':'\u25BC' }}</span></th>
                <th style="text-align:left;padding:8px 10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;cursor:pointer;" @click="sort('customer_type')">Type <span v-if="sortBy==='customer_type'">{{ sortDir==='asc'?'\u25B2':'\u25BC' }}</span></th>
                <th style="text-align:left;padding:8px 10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;cursor:pointer;" @click="sort('territory')">Territory <span v-if="sortBy==='territory'">{{ sortDir==='asc'?'\u25B2':'\u25BC' }}</span></th>
                <th style="text-align:left;padding:8px 10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;cursor:pointer;" @click="sort('customer_group')">Group <span v-if="sortBy==='customer_group'">{{ sortDir==='asc'?'\u25B2':'\u25BC' }}</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in filtered" :key="c.name" style="border-top:1px solid #f1f5f9;">
                <td style="padding:8px 10px;font-weight:700;color:#1e293b;">{{ c.name }}</td>
                <td style="padding:8px 10px;color:#475569;">{{ c.customer_name || '\u2014' }}</td>
                <td style="padding:8px 10px;"><span :style="tag(c.customer_type||'')">{{ c.customer_type || '\u2014' }}</span></td>
                <td style="padding:8px 10px;color:#64748b;">{{ c.territory || '\u2014' }}</td>
                <td style="padding:8px 10px;color:#64748b;">{{ c.customer_group || '\u2014' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:40px;text-align:center;color:#94a3b8;font-size:12px;">
          No customers found
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonContent } from "@ionic/vue"
import { getCustomers } from "@/api/common"

const q = ref("")
const sortBy = ref("name")
const sortDir = ref("asc")
const all = ref([])

const filtered = computed(() => {
  let list = [...all.value]
  if (q.value) {
    const s = q.value.toLowerCase()
    list = list.filter(c => (c.name||"").toLowerCase().includes(s) || (c.customer_name||"").toLowerCase().includes(s) || (c.customer_type||"").toLowerCase().includes(s) || (c.territory||"").toLowerCase().includes(s))
  }
  list.sort((a, b) => {
    const av = (a[sortBy.value]||""), bv = (b[sortBy.value]||"")
    return sortDir.value === "asc" ? av.localeCompare(bv) : bv.localeCompare(av)
  })
  return list
})

function sort(field) {
  if (sortBy.value === field) sortDir.value = sortDir.value === "asc" ? "desc" : "asc"
  else { sortBy.value = field; sortDir.value = "asc" }
}

function tag(v) {
  const m = { Company: "background:#eff6ff;color:#3b82f6;padding:2px 7px;border-radius:20px;font-size:9px;font-weight:700;", Individual: "background:#ecfdf5;color:#059669;padding:2px 7px;border-radius:20px;font-size:9px;font-weight:700;" }
  return m[v] || "background:#f8fafc;color:#64748b;padding:2px 7px;border-radius:20px;font-size:9px;font-weight:700;"
}

let debounceTimer
function onSearch() { clearTimeout(debounceTimer); debounceTimer = setTimeout(() => {}, 200) }

onMounted(async () => {
  try { all.value = await getCustomers() } catch (e) { console.error(e) }
})
</script>
