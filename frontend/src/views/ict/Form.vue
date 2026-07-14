<template>
  <ion-content>
    <div class="page anim-fade">
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="px-5 pt-5 pb-4 border-b border-gray-50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
              <ion-icon :icon="addCircleOutline" class="text-white text-lg" />
            </div>
            <div>
              <div class="text-base font-bold text-gray-900">New Transfer</div>
              <div class="text-xs text-gray-400">Inter-company stock transfer</div>
            </div>
          </div>
        </div>

        <div class="px-5 pt-4 pb-5">
          <div class="flex items-center gap-2 mb-5">
            <div class="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
              <div class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" :style="{ width: step+'%' }" />
            </div>
            <span class="text-[10px] font-bold text-gray-400">{{ Math.round(step) }}%</span>
          </div>

          <div v-if="section === 'companies'" class="anim-fade">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label"><ion-icon :icon="businessOutline" class="mr-1 text-indigo-400" />From Company</label>
                <select v-model="form.from_company" class="form-input" @change="updateWarehouses('from')">
                  <option value="" disabled>Select company</option>
                  <option v-for="c in companies" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>
              <div>
                <label class="form-label"><ion-icon :icon="businessOutline" class="mr-1 text-purple-400" />To Company</label>
                <select v-model="form.to_company" class="form-input" @change="updateWarehouses('to')">
                  <option value="" disabled>Select company</option>
                  <option v-for="c in companies" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>
            </div>
          </div>

          <div v-if="section === 'warehouses'" class="anim-fade">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label"><ion-icon :icon="storefrontOutline" class="mr-1 text-emerald-400" />Source Warehouse</label>
                <select v-model="form.from_warehouse" class="form-input">
                  <option value="" disabled>Select warehouse</option>
                  <option v-for="w in fromWarehouses" :key="w" :value="w">{{ w }}</option>
                </select>
              </div>
              <div>
                <label class="form-label"><ion-icon :icon="storefrontOutline" class="mr-1 text-amber-400" />Target Warehouse</label>
                <select v-model="form.to_warehouse" class="form-input">
                  <option value="" disabled>Select warehouse</option>
                  <option v-for="w in toWarehouses" :key="w" :value="w">{{ w }}</option>
                </select>
              </div>
            </div>
          </div>

          <div v-if="section === 'item'" class="anim-fade">
            <div class="form-group mb-3">
              <label class="form-label"><ion-icon :icon="cubeOutline" class="mr-1 text-blue-400" />Select Item</label>
              <div class="relative">
                <ion-icon :icon="searchOutline" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
                <input v-model="query" class="form-input pl-9" placeholder="Search items..." @input="open=true" @focus="open=true" />
              </div>
              <div v-if="open && filtered.length" class="mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg max-h-44 overflow-y-auto">
                <div v-for="item in filtered" :key="item.name"
                  class="flex items-center gap-3 px-3.5 py-3 text-sm hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                  @mousedown.prevent="select(item)">
                  <div class="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <ion-icon :icon="cubeOutline" class="text-indigo-400 text-sm" />
                  </div>
                  <div>
                    <div class="font-semibold text-gray-900">{{ item.name }}</div>
                    <div class="text-xs text-gray-400">{{ item.item_name }}</div>
                  </div>
                </div>
              </div>
              <div v-if="selected" class="mt-2 flex items-center gap-2.5 px-3.5 py-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
                <ion-icon :icon="checkmarkCircle" class="text-indigo-400 shrink-0" />
                <div>
                  <span class="text-sm font-semibold text-gray-900">{{ selected.name }}</span>
                  <span class="text-xs text-gray-400 ml-2">{{ selected.item_name }}</span>
                </div>
                <button class="ml-auto text-xs text-red-400 hover:text-red-600 font-bold bg-white rounded-lg px-2 py-1 shadow-sm" @click="clearItem">Remove</button>
              </div>
            </div>
          </div>

          <div v-if="section === 'details'" class="anim-fade">
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="form-label"><ion-icon :icon="layersOutline" class="mr-1 text-gray-400" />Quantity</label>
                <input v-model.number="form.qty" class="form-input" type="number" min="1" />
              </div>
              <div>
                <label class="form-label"><ion-icon :icon="cashOutline" class="mr-1 text-emerald-400" />Rate</label>
                <input v-model.number="form.rate" class="form-input" type="number" min="0" step="0.01" />
              </div>
              <div>
                <label class="form-label"><ion-icon :icon="walletOutline" class="mr-1 text-amber-400" />Amount</label>
                <div class="form-input bg-gray-50 text-gray-900 font-extrabold flex items-center text-base">{{ fmt(amount) }}</div>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2.5 mt-5 pt-4 border-t border-gray-50">
            <button v-if="section !== 'companies'" class="btn btn-outline text-sm flex-1" @click="prevSection">
              <ion-icon :icon="arrowBackOutline" /> Back
            </button>
            <button v-if="section !== lastSection" class="btn btn-primary text-sm flex-1" :disabled="!canProceed" @click="nextSection">
              Next <ion-icon :icon="arrowForwardOutline" />
            </button>
            <button v-else class="btn btn-primary text-sm flex-1" :disabled="saving || !ok" @click="submit">
              <ion-icon :icon="sendOutline" />
              {{ saving ? "Submitting..." : "Create Transfer" }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="error" class="mt-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
        <ion-icon :icon="alertCircleOutline" class="text-red-400 shrink-0" />{{ error }}
      </div>
      <div v-if="done" class="mt-4 bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center gap-2">
        <ion-icon :icon="checkmarkCircle" class="text-green-400 shrink-0" />{{ done }}
      </div>
    </div>
  </ion-content>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { IonContent, IonIcon } from "@ionic/vue"
import { addCircleOutline, businessOutline, storefrontOutline, cubeOutline, cashOutline, walletOutline, sendOutline, alertCircleOutline, checkmarkCircle, layersOutline, searchOutline, arrowBackOutline, arrowForwardOutline } from "ionicons/icons"
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

const section = ref("companies")
const sections = ["companies", "warehouses", "item", "details"]
const lastSection = sections[sections.length - 1]

const filtered = computed(() => {
  if (!query.value) return allItems.value.slice(0, 25)
  const q = query.value.toLowerCase()
  return allItems.value.filter(i => i.name.toLowerCase().includes(q) || (i.item_name||"").toLowerCase().includes(q)).slice(0, 30)
})
const amount = computed(() => (form.value.qty || 0) * (form.value.rate || 0))
const ok = computed(() => form.value.from_company && form.value.to_company && form.value.from_warehouse && form.value.to_warehouse && selected.value && form.value.qty > 0 && form.value.rate > 0)
const step = computed(() => (sections.indexOf(section.value) / (sections.length - 1)) * 100)
const canProceed = computed(() => {
  if (section.value === "companies") return form.value.from_company && form.value.to_company
  if (section.value === "warehouses") return form.value.from_warehouse && form.value.to_warehouse
  if (section.value === "item") return selected.value
  return true
})
const fmt = v => "₹" + Number(v || 0).toLocaleString("en-IN",{maximumFractionDigits:0})

function select(item) { selected.value = item; query.value = item.name; open.value = false; lookupRate(item.name) }
function clearItem() { selected.value = null; query.value = ""; form.value.rate = 0 }
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
function prevSection() {
  const idx = sections.indexOf(section.value)
  if (idx > 0) section.value = sections[idx - 1]
}
function nextSection() {
  const idx = sections.indexOf(section.value)
  if (idx < sections.length - 1) section.value = sections[idx + 1]
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
