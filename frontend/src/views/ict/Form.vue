<template>
  <ion-content>
    <div class="page anim-fade">

      <div class="form-card">
        <div class="flex items-center gap-2.5 mb-6">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <ion-icon :icon="addCircleOutline" class="text-white text-lg" />
          </div>
          <div>
            <div class="text-sm font-bold text-gray-900">New Transfer</div>
            <div class="text-xs text-gray-400">Inter-company stock transfer</div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label"><ion-icon :icon="businessOutline" class="mr-1 text-indigo-400" />From Company</label>
            <select v-model="form.from_company" class="form-input" @change="updateWarehouses('from')">
              <option value="" disabled>Select company</option>
              <option v-for="c in companies" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label"><ion-icon :icon="businessOutline" class="mr-1 text-purple-400" />To Company</label>
            <select v-model="form.to_company" class="form-input" @change="updateWarehouses('to')">
              <option value="" disabled>Select company</option>
              <option v-for="c in companies" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label"><ion-icon :icon="storefrontOutline" class="mr-1 text-emerald-400" />Source Warehouse</label>
            <select v-model="form.from_warehouse" class="form-input">
              <option value="" disabled>Select warehouse</option>
              <option v-for="w in fromWarehouses" :key="w" :value="w">{{ w }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label"><ion-icon :icon="storefrontOutline" class="mr-1 text-amber-400" />Target Warehouse</label>
            <select v-model="form.to_warehouse" class="form-input">
              <option value="" disabled>Select warehouse</option>
              <option v-for="w in toWarehouses" :key="w" :value="w">{{ w }}</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label"><ion-icon :icon="cubeOutline" class="mr-1 text-blue-400" />Item</label>
          <input v-model="query" class="form-input" placeholder="Search items..." @input="open=true" @focus="open=true" />
          <div v-if="open && filtered.length" class="mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg max-h-44 overflow-y-auto">
            <div v-for="item in filtered" :key="item.name"
              class="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-0"
              @mousedown.prevent="select(item)">
              <div class="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <ion-icon :icon="cubeOutline" class="text-indigo-400 text-xs" />
              </div>
              <div>
                <div class="font-medium text-gray-900">{{ item.name }}</div>
                <div class="text-xs text-gray-400">{{ item.item_name }}</div>
              </div>
            </div>
          </div>
          <div v-if="selected" class="mt-2 flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg">
            <ion-icon :icon="checkmarkCircle" class="text-indigo-400 text-sm" />
            <span class="text-sm font-medium text-gray-900">{{ selected.name }}</span>
            <button class="ml-auto text-xs text-red-400 hover:text-red-600 font-bold" @click="clearItem">&times;</button>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div class="form-group">
            <label class="form-label"><ion-icon :icon="layersOutline" class="mr-1 text-gray-400" />Quantity</label>
            <input v-model.number="form.qty" class="form-input" type="number" min="1" @input="calc" />
          </div>
          <div class="form-group">
            <label class="form-label"><ion-icon :icon="cashOutline" class="mr-1 text-emerald-400" />Rate</label>
            <input v-model.number="form.rate" class="form-input" type="number" min="0" step="0.01" @input="calc" />
          </div>
          <div class="form-group">
            <label class="form-label"><ion-icon :icon="walletOutline" class="mr-1 text-amber-400" />Amount</label>
            <div class="form-input bg-gray-50 text-gray-700 font-semibold flex items-center">{{ fmt(amount) }}</div>
          </div>
        </div>

        <button class="btn btn-primary w-full mt-2" :disabled="saving || !ok" @click="submit">
          <ion-icon :icon="sendOutline" />
          {{ saving ? "Submitting..." : "Create Transfer" }}
        </button>

        <div v-if="error" class="mt-4 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 flex items-center gap-2">
          <ion-icon :icon="alertCircleOutline" class="text-red-400" />{{ error }}
        </div>
        <div v-if="done" class="mt-4 text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3 flex items-center gap-2">
          <ion-icon :icon="checkmarkCircle" class="text-green-400" />{{ done }}
        </div>
      </div>
    </div>
  </ion-content>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { IonContent, IonIcon } from "@ionic/vue"
import { addCircleOutline, businessOutline, storefrontOutline, cubeOutline, cashOutline, walletOutline, sendOutline, alertCircleOutline, checkmarkCircle, layersOutline } from "ionicons/icons"
import { createInterCompanyTransfer } from "@/api/ict"
import { getCompanies, getItems, getCompanyWarehouses, getItemRate } from "@/api/common"

const emit = defineEmits(["created"])

const companies = ref([])
const allItems = ref([])
const fromWarehouses = ref([])
const toWarehouses = ref([])

const form = ref({ from_company: "", to_company: "", from_warehouse: "", to_warehouse: "", qty: 1, rate: 0 })
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
const amount = computed(() => (form.value.qty || 0) * (form.value.rate || 0))
const ok = computed(() => form.value.from_company && form.value.to_company && form.value.from_warehouse && form.value.to_warehouse && selected.value && form.value.qty > 0 && form.value.rate > 0)
const fmt = v => "₹" + Number(v || 0).toLocaleString("en-IN",{maximumFractionDigits:0})

function select(item) { selected.value = item; query.value = item.name; open.value = false; lookupRate(item.name) }
function clearItem() { selected.value = null; query.value = ""; form.value.rate = 0 }
function calc() {}
async function lookupRate(itemCode) {
  try { const r = await getItemRate(itemCode); form.value.rate = r.rate || 0 } catch(e) { form.value.rate = 0 }
}
async function updateWarehouses(side) {
  const company = side === "from" ? form.value.from_company : form.value.to_company
  if (!company) return
  try {
    const w = await getCompanyWarehouses(company)
    if (side === "from") fromWarehouses.value = w
    else toWarehouses.value = w
  } catch(e) { console.error(e) }
}

async function submit() {
  error.value = ""; done.value = ""; saving.value = true
  try {
    const r = await createInterCompanyTransfer({
      from_company: form.value.from_company,
      to_company: form.value.to_company,
      from_warehouse: form.value.from_warehouse,
      to_warehouse: form.value.to_warehouse,
      item: selected.value.name,
      qty: form.value.qty || 1,
      rate: form.value.rate || 0,
    })
    done.value = `✓ ${r.name} created (${r.status})`
    setTimeout(() => emit("created"), 1500)
  } catch(e) { error.value = e.messages?.[0] || e.message || "Failed" }
  finally { saving.value = false }
}

onMounted(async () => {
  try {
    const [c, i] = await Promise.all([getCompanies(), getItems()])
    companies.value = c; allItems.value = i
  } catch(e) { console.error(e) }
})
</script>
