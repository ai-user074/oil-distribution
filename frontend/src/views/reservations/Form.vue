<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/reservations"></ion-back-button>
        </ion-buttons>
        <ion-title>New Reservation</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="!isValid" @click="submitForm" strong>
            <ion-icon name="checkmark-outline" slot="start"></ion-icon>
            Create
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list class="form-list">
        <ion-item>
          <ion-label position="stacked">Company</ion-label>
          <ion-select :value="form.company" @ionChange="form.company = $event.detail.value" interface="action-sheet">
            <ion-select-option value="">Select Company</ion-select-option>
            <ion-select-option value="Geeta Enterprise">Geeta Enterprise</ion-select-option>
            <ion-select-option value="Global Export">Global Export</ion-select-option>
            <ion-select-option value="Shubham Enterprise">Shubham Enterprise</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Item</ion-label>
          <ion-select :value="form.item" @ionChange="form.item = $event.detail.value" interface="action-sheet">
            <ion-select-option value="">Select Item</ion-select-option>
            <ion-select-option v-for="it in itemOptions" :key="it.name" :value="it.name">{{ it.item_name || it.name }}</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Reserved Qty</ion-label>
          <ion-input type="number" min="1" :value="form.reserved_qty" @ionChange="form.reserved_qty = parseInt($event.detail.value) || 1"></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Reserved For</ion-label>
          <ion-select :value="form.reserved_for" @ionChange="form.reserved_for = $event.detail.value" interface="action-sheet">
            <ion-select-option value="">Select</ion-select-option>
            <ion-select-option value="Swastik">Swastik</ion-select-option>
            <ion-select-option value="Sales Order">Sales Order</ion-select-option>
            <ion-select-option value="Internal">Internal</ion-select-option>
            <ion-select-option value="Other">Other</ion-select-option>
          </ion-select>
        </ion-item>
      </ion-list>
      <ion-note v-if="formError" color="danger" class="form-error">{{ formError }}</ion-note>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonIcon, IonContent, IonList, IonItem, IonLabel, IonSelect, IonSelectOption, IonInput, IonNote } from "@ionic/vue"
import { useRouter } from "vue-router"

const router = useRouter()
const itemOptions = ref([])
const formError = ref("")
const form = ref({ company: "", item: "", reserved_qty: 1, reserved_for: "" })
const isValid = computed(() => form.value.company && form.value.item && form.value.reserved_qty >= 1 && form.value.reserved_for)

async function submitForm() {
  if (!isValid.value) return
  try {
    await frappe.call({ method: "oil_distribution.api.oil_ops.create_stock_reservation", args: form.value })
    router.push("/reservations")
  } catch (e) { formError.value = e.message || "Failed to create reservation" }
}
onMounted(async () => {
  try { itemOptions.value = (await frappe.call("frappe.client.get_list", { doctype: "Item", fields: ["name", "item_name"], limit: 100 })).message || [] } catch (e) { console.error(e) }
})
</script>

<style scoped>
.form-list { margin: 0; border-radius: 12px; overflow: hidden; }
.form-error { display: block; padding: 16px; font-size: 13px; }
</style>
