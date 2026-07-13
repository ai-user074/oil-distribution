<template>
  <Dialog :open="open" @close="$emit('close')" :options="{ title: 'Create Purchase Order', size: 'lg' }">
    <template #body>
      <div class="space-y-4 p-6">
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600">Supplier</label>
          <select v-model="form.supplier" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
            <option value="">Select Supplier</option>
            <option v-for="s in suppliers" :key="s.name" :value="s.name">{{ s.supplier_name || s.name }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600">Company</label>
          <select v-model="form.company" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
            <option value="Geeta Enterprise">Geeta Enterprise</option>
            <option value="Global Export">Global Export</option>
            <option value="Shubham Enterprise">Shubham Enterprise</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600">Items</label>
          <div v-for="(item, i) in form.items" :key="i" class="mb-2 flex gap-2">
            <select v-model="item.item_code" class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
              <option value="">Select Item</option>
              <option v-for="it in items" :key="it.name" :value="it.name">{{ it.item_name || it.name }}</option>
            </select>
            <input v-model.number="item.qty" type="number" min="1" placeholder="Qty" class="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            <input v-model.number="item.rate" type="number" min="0" placeholder="Rate" class="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            <button v-if="form.items.length > 1" @click="form.items.splice(i, 1)" class="rounded-lg p-2 text-red-500 hover:bg-red-50">✕</button>
          </div>
          <button @click="form.items.push({ item_code: '', qty: 1, rate: 0 })" class="mt-1 text-sm text-blue-600 hover:text-blue-700">+ Add Item</button>
        </div>
        <div v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-600">{{ error }}</div>
      </div>
    </template>
    <template #actions>
      <div class="flex items-center justify-end gap-2 px-6 pb-4">
        <Button @click="$emit('close')" variant="ghost">Cancel</Button>
        <Button @click="submit" :loading="submitting" variant="solid">Create PO</Button>
      </div>
    </template>
  </Dialog>
</template>

<script>
import { Dialog } from 'frappe-ui'

export default {
  name: 'CreatePODialog',
  components: { Dialog },
  props: {
    open: { type: Boolean, default: false },
  },
  emits: ['close', 'created'],
  data() {
    return {
      form: { supplier: '', company: 'Geeta Enterprise', items: [{ item_code: '', qty: 1, rate: 0 }] },
      suppliers: [],
      items: [],
      submitting: false,
      error: '',
    }
  },
  watch: {
    open(val) {
      if (val) {
        this.loadOptions()
        this.form = { supplier: '', company: 'Geeta Enterprise', items: [{ item_code: '', qty: 1, rate: 0 }] }
        this.error = ''
      }
    },
  },
  methods: {
    async loadOptions() {
      const [suppliers, items] = await Promise.all([
        frappe.call('frappe.client.get_list', {
          doctype: 'Supplier',
          fields: ['name', 'supplier_name'],
          limit: 100,
        }),
        frappe.call('frappe.client.get_list', {
          doctype: 'Item',
          fields: ['name', 'item_name'],
          limit: 100,
        }),
      ])
      this.suppliers = suppliers.message || []
      this.items = items.message || []
    },
    async submit() {
      if (!this.form.supplier) { this.error = 'Select supplier'; return }
      if (!this.form.items.length || !this.form.items[0].item_code) { this.error = 'Add at least one item'; return }
      this.submitting = true
      this.error = ''
      try {
        const res = await frappe.call({
          method: 'oil_distribution.api.oil_ops.create_purchase_order',
          args: this.form,
        })
        this.$emit('created', res.message)
        this.$emit('close')
      } catch (e) {
        this.error = e.message || 'Failed to create PO'
      } finally {
        this.submitting = false
      }
    },
  },
}
</script>
