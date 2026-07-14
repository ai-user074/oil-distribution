<template>
  <ion-content scroll-y="true">
    <div class="content-pad">
      <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h3 class="text-base font-bold text-gray-900 mb-5">New Inter-Company Transfer</h3>
        <div class="space-y-4">
          <div class="form-group">
            <label class="form-label">From Company</label>
            <select v-model="form.company" class="form-input" @change="onCompanyChange">
              <option value="" disabled>Select company</option>
              <option v-for="c in companies" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">To Company</label>
            <select v-model="form.to_company" class="form-input">
              <option value="" disabled>Select company</option>
              <option v-for="c in companies" :key="c" :value="c" :disabled="c === form.company">{{ c }}</option>
            </select>
          </div>

          <div class="border-t border-gray-100 my-2" />

          <div class="form-group">
            <label class="form-label">Item</label>
            <input v-model="searchQuery" class="form-input" placeholder="Search item..." @input="onSearchItem" />
            <div v-if="showItemDropdown && filteredItems.length" class="mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
              <div v-for="item in filteredItems" :key="item.name"
                class="px-4 py-3 text-sm hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                @click="selectItem(item)">
                <div class="font-medium text-gray-900">{{ item.name }}</div>
                <div class="text-xs text-gray-400">{{ item.item_name }} · {{ item.stock_uom }}</div>
              </div>
            </div>
          </div>

          <div v-if="selectedItem" class="bg-blue-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <div class="text-sm font-semibold text-gray-900">{{ selectedItem.name }}</div>
              <div class="text-xs text-gray-500">{{ selectedItem.item_name }}</div>
            </div>
            <button class="text-xs text-red-500 font-medium" @click="clearItem">Change</button>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="form-group">
              <label class="form-label">Quantity</label>
              <input v-model.number="form.qty" class="form-input" type="number" min="1" placeholder="1" />
            </div>
            <div class="form-group">
              <label class="form-label">Rate (₹)</label>
              <input v-model.number="form.rate" class="form-input" type="number" min="0" :placeholder="ratePlaceholder" />
            </div>
          </div>

          <div v-if="form.qty && form.rate" class="bg-gray-50 rounded-xl px-4 py-3 text-sm">
            <span class="text-gray-500">Amount: </span>
            <span class="font-bold text-gray-900">₹{{ (form.qty * form.rate).toLocaleString("en-IN") }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">Source Warehouse</label>
            <select v-model="form.source_warehouse" class="form-input">
              <option value="" disabled>Select warehouse</option>
              <option v-for="w in sourceWarehouses" :key="w.name" :value="w.name">{{ w.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Target Warehouse</label>
            <select v-model="form.target_warehouse" class="form-input">
              <option value="" disabled>Select warehouse</option>
              <option v-for="w in targetWarehouses" :key="w.name" :value="w.name">{{ w.name }}</option>
            </select>
          </div>

          <button class="btn btn-primary w-full mt-2" :disabled="submitting || !isValid" @click="submit">
            <ion-icon :icon="sparklesOutline" v-if="!submitting" />
            {{ submitting ? "Creating Transfer..." : "Create Transfer" }}
          </button>

          <div v-if="error" class="bg-red-50 rounded-xl p-4 text-sm text-red-600">{{ error }}</div>
          <div v-if="success" class="bg-green-50 rounded-xl p-4 text-sm text-green-700">
            <div class="font-semibold">✓ Created Successfully</div>
            <div class="mt-1">{{ success }}</div>
          </div>
        </div>
      </div>
    </div>
  </ion-content>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { IonContent, IonIcon } from "@ionic/vue"
import { sparklesOutline } from "ionicons/icons"
import { createInterCompanyTransfer } from "@/api/ict"
import { getCompanies, getItems, getCompanyWarehouses, getItemRate } from "@/api/common"

const emit = defineEmits(["created"])

const companies = ref([])
const allItems = ref([])
const sourceWarehouses = ref([])
const targetWarehouses = ref([])

const form = ref({
  company: "",
  to_company: "",
  qty: 1,
  rate: 0,
  source_warehouse: "",
  target_warehouse: "",
})

const searchQuery = ref("")
const selectedItem = ref(null)
const showItemDropdown = ref(false)

const submitting = ref(false)
const error = ref("")
const success = ref("")

const filteredItems = computed(() => {
  if (!searchQuery.value) return allItems.value.slice(0, 20)
  const q = searchQuery.value.toLowerCase()
  return allItems.value.filter(i =>
    i.name.toLowerCase().includes(q) ||
    (i.item_name && i.item_name.toLowerCase().includes(q))
  ).slice(0, 30)
})

const ratePlaceholder = computed(() => {
  return selectedItem.value ? "Auto-fetching..." : "Enter rate"
})

const isValid = computed(() => {
  return form.value.company &&
    form.value.to_company &&
    selectedItem.value &&
    form.value.qty > 0 &&
    form.value.source_warehouse &&
    form.value.target_warehouse
})

function selectItem(item) {
  selectedItem.value = item
  searchQuery.value = item.name
  showItemDropdown.value = false
  fetchRate(item.name)
}

function clearItem() {
  selectedItem.value = null
  searchQuery.value = ""
  form.value.rate = 0
}

function onSearchItem() {
  showItemDropdown.value = true
  if (!searchQuery.value) {
    selectedItem.value = null
  }
}

async function fetchRate(itemCode) {
  try {
    const res = await getItemRate(itemCode)
    if (res.rate) form.value.rate = res.rate
  } catch (e) {
    // silent
  }
}

async function onCompanyChange() {
  if (form.value.company) {
    sourceWarehouses.value = await getCompanyWarehouses(form.value.company)
  }
  if (form.value.to_company) {
    targetWarehouses.value = await getCompanyWarehouses(form.value.to_company)
  }
}

async function submit() {
  error.value = ""
  success.value = ""
  submitting.value = true
  try {
    const result = await createInterCompanyTransfer({
      company: form.value.company,
      to_company: form.value.to_company,
      items: [{
        item_code: selectedItem.value.name,
        qty: form.value.qty || 1,
        rate: form.value.rate || 0,
        source_warehouse: form.value.source_warehouse,
        target_warehouse: form.value.target_warehouse,
      }],
    })
    success.value = `${result.name} — ${result.status}`
    setTimeout(() => emit("created"), 1500)
  } catch (e) {
    error.value = e.messages?.[0] || e.message || "Failed to create transfer"
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const [co, it] = await Promise.all([getCompanies(), getItems()])
    companies.value = co
    allItems.value = it
  } catch (e) {
    console.error("Failed to load form data:", e)
  }
})
</script>
