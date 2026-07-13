<template>
  <Dialog :open="open" @close="$emit('close')" :options="{ title: 'New Stock Reservation', size: 'md' }">
    <template #body>
      <div class="space-y-4 p-6">
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600">Company</label>
          <select v-model="form.company" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
            <option value="">Select</option>
            <option value="Geeta Enterprise">Geeta Enterprise</option>
            <option value="Global Export">Global Export</option>
            <option value="Shubham Enterprise">Shubham Enterprise</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600">Item</label>
          <select v-model="form.item" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
            <option value="">Select Item</option>
            <option v-for="it in items" :key="it.name" :value="it.name">{{ it.item_name || it.name }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600">Reserved Qty</label>
          <input v-model.number="form.reserved_qty" type="number" min="1" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600">Reserved For</label>
          <select v-model="form.reserved_for" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
            <option value="">Select</option>
            <option value="Swastik">Swastik</option>
            <option value="Sales Order">Sales Order</option>
            <option value="Internal">Internal</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-600">{{ error }}</div>
      </div>
    </template>
    <template #actions>
      <div class="flex items-center justify-end gap-2 px-6 pb-4">
        <Button @click="$emit('close')" variant="ghost">Cancel</Button>
        <Button @click="submit" :loading="submitting" variant="solid">Create Reservation</Button>
      </div>
    </template>
  </Dialog>
</template>

<script>
import { Dialog } from 'frappe-ui'

export default {
  name: 'CreateReservationDialog',
  components: { Dialog },
  props: { open: { type: Boolean, default: false } },
  emits: ['close', 'created'],
  data() {
    return {
      form: { company: '', item: '', reserved_qty: 1, reserved_for: '' },
      items: [],
      submitting: false,
      error: '',
    }
  },
  watch: {
    open(val) {
      if (val) {
        this.loadOptions()
        this.form = { company: '', item: '', reserved_qty: 1, reserved_for: '' }
        this.error = ''
      }
    },
  },
  methods: {
    async loadOptions() {
      const res = await frappe.call('frappe.client.get_list', { doctype: 'Item', fields: ['name', 'item_name'], limit: 100 })
      this.items = res.message || []
    },
    async submit() {
      if (!this.form.company) { this.error = 'Select company'; return }
      if (!this.form.item) { this.error = 'Select item'; return }
      if (!this.form.reserved_qty || this.form.reserved_qty < 1) { this.error = 'Enter valid quantity'; return }
      this.submitting = true
      this.error = ''
      try {
        const res = await frappe.call({
          method: 'oil_distribution.api.oil_ops.create_stock_reservation',
          args: this.form,
        })
        this.$emit('created', res.message)
        this.$emit('close')
      } catch (e) {
        this.error = e.message || 'Failed to create reservation'
      } finally {
        this.submitting = false
      }
    },
  },
}
</script>
