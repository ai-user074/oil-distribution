<template>
  <ion-content>
    <div class="page">
      <div class="form-card">
        <div class="text-base font-semibold text-gray-900 mb-6">New Inter-Company Transfer</div>

        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">From Company</label>
            <select v-model="form.company" class="form-input" @change="onCompanyChange">
              <option value="" disabled>Select company</option>
              <option v-for="c in companies" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">To Company</label>
            <select v-model="form.to_company" class="form-input" @change="onToChange">
              <option value="" disabled>Select company</option>
              <option v-for="c in companies" :key="c" :value="c" :disabled="c === form.company">{{ c }}</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Item</label>
          <input v-model="query" class="form-input" placeholder="Search items..." @input="open=true" @focus="open=true" />
          <div v-if="open && filtered.length" class="mt-1 bg-white border border-gray-200 rounded-lg shadow-sm max-h-44 overflow-y-auto">
            <div v-for="item in filtered" :key="item.name"
              class="px-3 py-2.5 text-sm hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
              @mousedown.prevent="select(item)">
              <div class="font-medium text-gray-900">{{ item.name }}</div>
              <div class="text-xs text-gray-400">{{ item.item_name }}</div>
            </div>
          </div>
          <div v-if="selected" class="mt-2 flex items-center gap-2 text-sm text-gray-700">
            <span class="font-medium">{{ selected.name }}</span>
            <button class="text-xs text-red-400 hover:text-red-600" @click="clearItem">&times;</button>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div class="form-group">
            <label class="form-label">Quantity</label>
            <input v-model.number="form.qty" class="form-input" type="number" min="1" />
          </div>
          <div class="form-group">
            <label class="form-label">Rate</label>
            <input v-model.number="form.rate" class="form-input" type="number" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label">Amount</label>
            <div class="form-input bg-gray-50 text-gray-700 font-medium flex items-center">{{ fmt((form.qty||0)*(form.rate||0)) }}</div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">Source Warehouse</label>
            <select v-model="form.source_warehouse" class="form-input">
              <option value="" disabled>Select</option>
              <option v-for="w in srcWh" :key="w.name" :value="w.name">{{ w.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Target Warehouse</label>
            <select v-model="form.target_warehouse" class="form-input">
              <option value="" disabled>Select</option>
              <option v-for="w in tgtWh" :key="w.name" :value="w.name">{{ w.name }}</option>
            </select>
          </div>
        </div>

        <button class="btn btn-primary w-full mt-2" :disabled="saving || !ok" @click="submit">
          {{ saving ? "Creating..." : "Create Transfer" }}
        </button>

        <div v-if="error" class="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{{ error }}</div>
        <div v-if="done" class="mt-4 text-sm text-green-700 bg-green-50 rounded-lg px-4 py-3">{{ done }}</div>
      </div>
    </div>
  </ion-content>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { IonContent } from "@ionic/vue"
import { createInterCompanyTransfer } from "@/api/ict"
import { getCompanies, getItems, getCompanyWarehouses, getItemRate } from "@/api/common"

const emit = defineEmits(["created"])

const companies = ref([])
const allItems = ref([])
const srcWh = ref([])
const tgtWh = ref([])

const form = ref({ company: "", to_company: "", qty: 1, rate: 0, source_warehouse: "", target_warehouse: "" })
const query = ref("")
const selected = ref(null)
const open = ref(false)
const saving = ref(false)
const error = ref("")
const done = ref("")

const filtered = computed(() => {
  if (!query.value) return allItems.value.slice(0, 25)
  const q = query.value.toLowerCase()
  return allItems.value.filter(i => i.name.toLowerCase().includes(q) || (i.item_name||"").toLowerCase().includes(q)).slice(0, 30)
})

const ok = computed(() => form.value.company && form.value.to_company && selected.value && form.value.qty > 0 && form.value.source_warehouse && form.value.target_warehouse)

function fmt(v) { return "₹" + Number(v || 0).toLocaleString("en-IN") }

function select(item) {
  selected.value = item; query.value = item.name; open.value = false
  getItemRate(item.name).then(r => { if (r.rate) form.value.rate = r.rate }).catch(() => {})
}
function clearItem() { selected.value = null; query.value = ""; form.value.rate = 0 }

async function onCompanyChange() {
  srcWh.value = form.value.company ? await getCompanyWarehouses(form.value.company) : []
}
async function onToChange() {
  tgtWh.value = form.value.to_company ? await getCompanyWarehouses(form.value.to_company) : []
}

async function submit() {
  error.value = ""; done.value = ""; saving.value = true
  try {
    const r = await createInterCompanyTransfer({
      company: form.value.company, to_company: form.value.to_company,
      items: [{ item_code: selected.value.name, qty: form.value.qty || 1, rate: form.value.rate || 0, source_warehouse: form.value.source_warehouse, target_warehouse: form.value.target_warehouse }],
    })
    done.value = `✓ ${r.name} created (${r.status})`
    setTimeout(() => emit("created"), 1500)
  } catch (e) { error.value = e.messages?.[0] || e.message || "Failed" }
  finally { saving.value = false }
}

onMounted(async () => {
  try { const [c, i] = await Promise.all([getCompanies(), getItems()]); companies.value = c; allItems.value = i } catch (e) { console.error(e) }
})
</script>
