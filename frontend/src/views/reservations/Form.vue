<template>
  <ion-content scroll-y="true">
    <div class="content-pad">
      <div class="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h3 class="text-base font-bold text-gray-900 mb-5">New Stock Reservation</h3>
        <div class="space-y-4">
          <div class="form-group">
            <label class="form-label">Company</label>
            <select v-model="form.company" class="form-input">
              <option value="" disabled>Select company</option>
              <option v-for="c in companies" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Item</label>
            <input v-model="searchQuery" class="form-input" placeholder="Search item..." @input="showDropdown = true" />
            <div v-if="showDropdown && filteredItems.length" class="mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
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
              <input v-model.number="form.reserved_qty" class="form-input" type="number" min="1" placeholder="1" />
            </div>
            <div class="form-group">
              <label class="form-label">Reserved For</label>
              <select v-model="form.reserved_for" class="form-input">
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

          <button class="btn btn-primary w-full mt-2" :disabled="submitting || !isValid" @click="submit">
            <ion-icon :icon="lockClosedOutline" v-if="!submitting" />
            {{ submitting ? "Reserving..." : "Create Reservation" }}
          </button>

          <div v-if="error" class="bg-red-50 rounded-xl p-4 text-sm text-red-600">{{ error }}</div>
          <div v-if="success" class="bg-green-50 rounded-xl p-4 text-sm text-green-700">
            <div class="font-semibold">✓ Reserved Successfully</div>
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
import { lockClosedOutline } from "ionicons/icons"
import { createStockReservation } from "@/api/reservations"
import { getCompanies, getItems } from "@/api/common"

const emit = defineEmits(["created"])

const companies = ref([])
const allItems = ref([])

const form = ref({
  company: "",
  reserved_qty: 1,
  reserved_for: "",
})

const searchQuery = ref("")
const selectedItem = ref(null)
const showDropdown = ref(false)

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

const isValid = computed(() => {
  return form.value.company && selectedItem.value && form.value.reserved_qty > 0
})

function selectItem(item) {
  selectedItem.value = item
  searchQuery.value = item.name
  showDropdown.value = false
}

function clearItem() {
  selectedItem.value = null
  searchQuery.value = ""
}

async function submit() {
  error.value = ""
  success.value = ""
  submitting.value = true
  try {
    const result = await createStockReservation({
      company: form.value.company,
      item: selectedItem.value.name,
      reserved_qty: form.value.reserved_qty || 1,
      reserved_for: form.value.reserved_for,
    })
    success.value = `${result.name} — ${result.status}`
    setTimeout(() => emit("created"), 1500)
  } catch (e) {
    error.value = e.messages?.[0] || e.message || "Failed to create reservation"
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
