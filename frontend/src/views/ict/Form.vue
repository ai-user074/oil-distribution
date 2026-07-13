<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/ict"></ion-back-button>
        </ion-buttons>
        <ion-title>New Transfer</ion-title>
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
          <ion-label position="stacked">From Company</ion-label>
          <ion-select :value="form.company" @ionChange="form.company = $event.detail.value" interface="action-sheet">
            <ion-select-option value="Geeta Enterprise">Geeta Enterprise</ion-select-option>
            <ion-select-option value="Global Export">Global Export</ion-select-option>
            <ion-select-option value="Shubham Enterprise">Shubham Enterprise</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">To Company</ion-label>
          <ion-select :value="form.to_company" @ionChange="form.to_company = $event.detail.value" interface="action-sheet">
            <ion-select-option v-for="c in otherCompanies" :key="c" :value="c">{{ c }}</ion-select-option>
          </ion-select>
        </ion-item>
      </ion-list>

      <div class="content-section" style="padding: 0;">
        <p class="section-title" style="margin-bottom: 12px;">Items</p>
        <ion-card v-for="(item, i) in form.items" :key="i" class="item-card">
          <ion-card-content>
            <div class="item-card-header">
              <span class="item-card-title">Item {{ i + 1 }}</span>
              <ion-button v-if="form.items.length > 1" fill="clear" color="danger" size="small" @click="form.items.splice(i, 1)">
                <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
              </ion-button>
            </div>
            <ion-list class="item-fields">
              <ion-item>
                <ion-label position="stacked">Item Code</ion-label>
                <ion-select :value="item.item_code" @ionChange="item.item_code = $event.detail.value" interface="action-sheet">
                  <ion-select-option value="">Select Item</ion-select-option>
                  <ion-select-option v-for="it in itemOptions" :key="it.name" :value="it.name">{{ it.item_name || it.name }}</ion-select-option>
                </ion-select>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Qty</ion-label>
                <ion-input type="number" min="1" :value="item.qty" @ionChange="item.qty = parseInt($event.detail.value) || 1"></ion-input>
              </ion-item>
              <ion-item>
                <ion-label position="stacked">Rate</ion-label>
                <ion-input type="number" min="0" :value="item.rate" @ionChange="item.rate = parseFloat($event.detail.value) || 0"></ion-input>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>
        <ion-button fill="clear" expand="block" @click="addItem">
          <ion-icon name="add-circle-outline" slot="start"></ion-icon>
          Add Item
        </ion-button>
      </div>

      <ion-note v-if="formError" color="danger" class="form-error">{{ formError }}</ion-note>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonIcon, IonContent, IonList, IonItem, IonLabel, IonSelect, IonSelectOption, IonInput, IonCard, IonCardContent, IonNote } from "@ionic/vue"
import { useRouter } from "vue-router"

const router = useRouter()
const companies = ["Geeta Enterprise", "Global Export", "Shubham Enterprise"]
const itemOptions = ref([])
const formError = ref("")
const form = ref({ company: "", to_company: "", items: [{ item_code: "", qty: 1, rate: 0 }] })
const otherCompanies = computed(() => companies.filter(c => c !== form.value.company))
const isValid = computed(() => form.value.company && form.value.to_company && form.value.items.length && form.value.items[0].item_code)

function addItem() { form.value.items.push({ item_code: "", qty: 1, rate: 0 }) }
async function submitForm() {
  if (!isValid.value) return
  try {
    await frappe.call({ method: "oil_distribution.api.oil_ops.create_inter_company_transfer", args: form.value })
    router.push("/ict")
  } catch (e) { formError.value = e.message || "Failed to create transfer" }
}
onMounted(async () => {
  try { itemOptions.value = (await frappe.call("frappe.client.get_list", { doctype: "Item", fields: ["name", "item_name"], limit: 100 })).message || [] } catch (e) { console.error(e) }
})
</script>

<style scoped>
.form-list { margin: 0; border-radius: 12px; overflow: hidden; margin-bottom: 20px; }
.item-card { margin: 0 0 12px 0; border-radius: 12px; }
.item-card ion-card-content { padding: 12px; }
.item-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.item-card-title { font-size: 13px; font-weight: 600; color: #64748b; }
.item-fields { margin: 0; border-radius: 8px; overflow: hidden; }
.form-error { display: block; padding: 16px; font-size: 13px; }
</style>
