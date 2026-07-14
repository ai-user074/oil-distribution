<template>
  <ion-content class="ion-padding">
    <div class="bg-white rounded-2xl p-5 border border-gray-100">
      <div class="space-y-4">
        <div class="form-group">
          <label class="form-label">From Company</label>
          <select v-model="form.company" class="form-input">
            <option value="" disabled>Select company</option>
            <option v-for="c in companies" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">To Company</label>
          <select v-model="form.to_company" class="form-input">
            <option value="" disabled>Select company</option>
            <option v-for="c in companies" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Item Code</label>
          <input v-model="form.item_code" class="form-input" placeholder="e.g. ENGINE-10W30" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="form-group">
            <label class="form-label">Quantity</label>
            <input v-model.number="form.qty" class="form-input" type="number" min="1" />
          </div>
          <div class="form-group">
            <label class="form-label">Rate</label>
            <input v-model.number="form.rate" class="form-input" type="number" min="0" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Source Warehouse</label>
          <input v-model="form.source_warehouse" class="form-input" placeholder="e.g. Available WH - GE" />
        </div>

        <div class="form-group">
          <label class="form-label">Target Warehouse</label>
          <input v-model="form.target_warehouse" class="form-input" placeholder="e.g. Available WH - GEX" />
        </div>

        <button class="btn btn-primary w-full" :disabled="submitting" @click="submit">
          {{ submitting ? "Creating..." : "Create Transfer" }}
        </button>

        <div v-if="error" class="text-sm text-red-500 bg-red-50 rounded-lg p-3">{{ error }}</div>
        <div v-if="success" class="text-sm text-green-600 bg-green-50 rounded-lg p-3">
          Created: {{ success }}
        </div>
      </div>
    </div>
  </ion-content>
</template>

<script setup>
import { ref } from "vue"
import { IonContent } from "@ionic/vue"
import { createInterCompanyTransfer } from "@/api/ict"

const emit = defineEmits(["created"])

const companies = ["Geeta Enterprise", "Global Export", "Shubham Enterprise"]

const form = ref({
  company: "",
  to_company: "",
  item_code: "",
  qty: 1,
  rate: 0,
  source_warehouse: "",
  target_warehouse: "",
})

const submitting = ref(false)
const error = ref("")
const success = ref("")

async function submit() {
  error.value = ""
  success.value = ""
  if (!form.value.company || !form.value.to_company) {
    error.value = "Select both companies"
    return
  }
  if (!form.value.item_code) {
    error.value = "Enter item code"
    return
  }
  submitting.value = true
  try {
    const payload = {
      company: form.value.company,
      to_company: form.value.to_company,
      items: [{
        item_code: form.value.item_code,
        qty: form.value.qty || 1,
        rate: form.value.rate || 0,
        source_warehouse: form.value.source_warehouse,
        target_warehouse: form.value.target_warehouse,
      }],
    }
    const result = await createInterCompanyTransfer(payload)
    success.value = `${result.name} (${result.status})`
    setTimeout(() => emit("created"), 1500)
  } catch (e) {
    error.value = e.message || "Failed to create transfer"
  } finally {
    submitting.value = false
  }
}
</script>
