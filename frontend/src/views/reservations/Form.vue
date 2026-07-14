<template>
  <ion-content>
    <div class="page">
      <div class="form-card">
        <div class="text-base font-semibold text-gray-900 mb-6">New Stock Reservation</div>

        <div class="form-group">
          <label class="form-label">Company</label>
          <select v-model="form.company" class="form-input">
            <option value="" disabled>Select company</option>
            <option v-for="c in companies" :key="c" :value="c">{{ c }}</option>
          </select>
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

        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">Quantity</label>
            <input v-model.number="form.reserved_qty" class="form-input" type="number" min="1" />
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

        <button class="btn btn-primary w-full mt-2" :disabled="saving || !ok" @click="submit">
          {{ saving ? "Reserving..." : "Create Reservation" }}
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
import { createStockReservation } from "@/api/reservations"
import { getCompanies, getItems } from "@/api/common"

const emit = defineEmits(["created"])

const companies = ref([])
const allItems = ref([])

const form = ref({ company: "", reserved_qty: 1, reserved_for: "" })
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

const ok = computed(() => form.value.company && selected.value && form.value.reserved_qty > 0)

function select(item) { selected.value = item; query.value = item.name; open.value = false }
function clearItem() { selected.value = null; query.value = "" }

async function submit() {
  error.value = ""; done.value = ""; saving.value = true
  try {
    const r = await createStockReservation({ company: form.value.company, item: selected.value.name, reserved_qty: form.value.reserved_qty || 1, reserved_for: form.value.reserved_for })
    done.value = `✓ ${r.name} created (${r.status})`
    setTimeout(() => emit("created"), 1500)
  } catch (e) { error.value = e.messages?.[0] || e.message || "Failed" }
  finally { saving.value = false }
}

onMounted(async () => {
  try { const [c, i] = await Promise.all([getCompanies(), getItems()]); companies.value = c; allItems.value = i } catch (e) { console.error(e) }
})
</script>
