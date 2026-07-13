<template>
  <Dialog :open="open" @close="$emit('close')" :options="{ title: 'New Inter Company Transfer', size: 'lg' }">
    <template #body>
      <div class="space-y-4 p-6">
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600">From Company</label>
          <select v-model="form.company" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
            <option value="">Select</option>
            <option value="Geeta Enterprise">Geeta Enterprise</option>
            <option value="Global Export">Global Export</option>
            <option value="Shubham Enterprise">Shubham Enterprise</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600">To Company</label>
          <select v-model="form.to_company" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
            <option value="">Select</option>
            <option v-for="c in otherCompanies" :key="c" :value="c">{{ c }}</option>
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
            <select v-model="item.source_warehouse" class="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
              <option value="">Src WH</option>
              <option v-for="wh in sourceWarehouses" :key="wh" :value="wh">{{ wh }}</option>
            </select>
            <select v-model="item.target_warehouse" class="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
              <option value="">Tgt WH</option>
              <option v-for="wh in targetWarehouses" :key="wh" :value="wh">{{ wh }}</option>
            </select>
            <button v-if="form.items.length > 1" @click="form.items.splice(i, 1)" class="rounded-lg p-2 text-red-500 hover:bg-red-50">✕</button>
          </div>
          <button @click="form.items.push({ item_code: '', qty: 1, rate: 0, source_warehouse: '', target_warehouse: '' })" class="mt-1 text-sm text-blue-600 hover:text-blue-700">+ Add Item</button>
        </div>
        <div v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-600">{{ error }}</div>
      </div>
    </template>
    <template #actions>
      <div class="flex items-center justify-end gap-2 px-6 pb-4">
        <Button @click="$emit('close')" variant="ghost">Cancel</Button>
        <Button @click="submit" :loading="submitting" variant="solid">Create ICT</Button>
      </div>
    </template>
  </Dialog>
</template>

<script>
import { Dialog } from 'frappe-ui'

const ALL_COMPANIES = ['Geeta Enterprise', 'Global Export', 'Shubham Enterprise']

export default {
  name: 'CreateICTDialog',
  components: { Dialog },
  props: { open: { type: Boolean, default: false } },
  emits: ['close', 'created'],
  data() {
    return {
      form: { company: '', to_company: '', items: [{ item_code: '', qty: 1, rate: 0, source_warehouse: '', target_warehouse: '' }] },
      items: [],
      warehouses: [],
      submitting: false,
      error: '',
    }
  },
  computed: {
    otherCompanies() {
      return ALL_COMPANIES.filter((c) => c !== this.form.company)
    },
    sourceWarehouses() {
      if (!this.form.company) return []
      const abbr = { 'Geeta Enterprise': 'GE', 'Global Export': 'GEX', 'Shubham Enterprise': 'SHE' }[this.form.company]
      return this.warehouses.filter((w) => w.includes(`Available WH - ${abbr}`))
    },
    targetWarehouses() {
      if (!this.form.to_company) return []
      const abbr = { 'Geeta Enterprise': 'GE', 'Global Export': 'GEX', 'Shubham Enterprise': 'SHE' }[this.form.to_company]
      return this.warehouses.filter((w) => w.includes(`Available WH - ${abbr}`))
    },
  },
  watch: {
    open(val) {
      if (val) {
        this.loadOptions()
        this.form = { company: '', to_company: '', items: [{ item_code: '', qty: 1, rate: 0, source_warehouse: '', target_warehouse: '' }] }
        this.error = ''
      }
    },
  },
  methods: {
    async loadOptions() {
      const [items, whs] = await Promise.all([
        frappe.call('frappe.client.get_list', { doctype: 'Item', fields: ['name', 'item_name'], limit: 100 }),
        frappe.call('frappe.client.get_list', { doctype: 'Warehouse', fields: ['name'], limit: 200 }),
      ])
      this.items = items.message || []
      this.warehouses = (whs.message || []).map((w) => w.name)
    },
    async submit() {
      if (!this.form.company || !this.form.to_company) { this.error = 'Select from and to company'; return }
      if (!this.form.items.length || !this.form.items[0].item_code) { this.error = 'Add at least one item'; return }
      this.submitting = true
      this.error = ''
      try {
        const res = await frappe.call({
          method: 'oil_distribution.api.oil_ops.create_inter_company_transfer',
          args: this.form,
        })
        this.$emit('created', res.message)
        this.$emit('close')
      } catch (e) {
        this.error = e.message || 'Failed to create ICT'
      } finally {
        this.submitting = false
      }
    },
  },
}
</script>
