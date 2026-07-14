<template>
  <ion-content class="ion-padding">
    <div class="bg-white rounded-2xl p-5 border border-gray-100">
      <div class="space-y-4">
        <div class="form-group">
          <label class="form-label">Company</label>
          <select v-model="form.company" class="form-input">
            <option value="" disabled>Select company</option>
            <option v-for="c in companies" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Item Code</label>
          <input v-model="form.item" class="form-input" placeholder="e.g. ENGINE-10W30" />
        </div>

        <div class="grid grid-cols-2 gap-3">
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

        <button class="btn btn-primary w-full" :disabled="submitting" @click="submit">
          {{ submitting ? "Reserving..." : "Create Reservation" }}
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
import { createStockReservation } from "@/api/reservations"

const emit = defineEmits(["created"])

const companies = ["Geeta Enterprise", "Global Export", "Shubham Enterprise"]

const form = ref({
  company: "",
  item: "",
  reserved_qty: 1,
  reserved_for: "",
})

const submitting = ref(false)
const error = ref("")
const success = ref("")

async function submit() {
  error.value = ""
  success.value = ""
  if (!form.value.company) {
    error.value = "Select a company"
    return
  }
  if (!form.value.item) {
    error.value = "Enter item code"
    return
  }
  submitting.value = true
  try {
    const result = await createStockReservation({
      company: form.value.company,
      item: form.value.item,
      reserved_qty: form.value.reserved_qty || 1,
      reserved_for: form.value.reserved_for,
    })
    success.value = `${result.name} (${result.status})`
    setTimeout(() => emit("created"), 1500)
  } catch (e) {
    error.value = e.message || "Failed to create reservation"
  } finally {
    submitting.value = false
  }
}
</script>
