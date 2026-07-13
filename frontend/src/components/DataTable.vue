<template>
  <div class="overflow-hidden rounded-xl border bg-white">
    <div v-if="title" class="flex items-center justify-between border-b px-5 py-3">
      <h3 class="text-sm font-semibold text-gray-900">{{ title }}</h3>
      <span v-if="rows && rows.length" class="text-xs text-gray-400">{{ rows.length }} rows</span>
    </div>
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
    </div>
    <div v-else-if="!rows || rows.length === 0" class="py-12 text-center text-sm text-gray-400">
      No data
    </div>
    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b bg-gray-50">
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-5 py-3 font-medium text-gray-600"
              :class="col.align === 'right' ? 'text-right' : ''"
              :style="col.width ? { width: col.width } : {}"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, i) in rows"
            :key="i"
            class="border-b last:border-b-0 hover:bg-gray-50"
            :class="row._class || ''"
            @click="rowClick ? $emit('row-click', row) : null"
            :style="rowClick ? { cursor: 'pointer' } : {}"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              class="px-5 py-3"
              :class="col.align === 'right' ? 'text-right' : ''"
            >
              <slot :name="'cell-' + col.key" :row="row" :value="getValue(row, col)">
                <template v-if="col.format === 'currency'">{{ formatCurrency(getValue(row, col)) }}</template>
                <template v-else-if="col.format === 'number'">{{ formatNumber(getValue(row, col)) }}</template>
                <template v-else-if="col.format === 'status'">
                  <span
                    class="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                    :class="statusClass(getValue(row, col))"
                  >
                    {{ getValue(row, col) }}
                  </span>
                </template>
                <template v-else>{{ getValue(row, col) }}</template>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DataTable',
  props: {
    title: { type: String, default: '' },
    columns: { type: Array, required: true },
    rows: { type: Array, default: null },
    loading: { type: Boolean, default: false },
  },
  emits: ['row-click'],
  methods: {
    getValue(row, col) {
      if (col.value) return col.value(row)
      const keys = col.key.split('.')
      let val = row
      for (const k of keys) val = val?.[k]
      return val ?? ''
    },
    formatCurrency(n) {
      if (n == null) return ''
      const v = Number(n)
      if (v >= 10000000) return '₹' + (v / 10000000).toFixed(2) + 'Cr'
      if (v >= 100000) return '₹' + (v / 100000).toFixed(2) + 'L'
      if (v >= 1000) return '₹' + (v / 1000).toFixed(1) + 'K'
      return '₹' + v.toLocaleString('en-IN')
    },
    formatNumber(n) {
      if (n == null) return ''
      return Number(n).toLocaleString('en-IN')
    },
    statusClass(val) {
      if (!val) return 'bg-gray-100 text-gray-600'
      const s = String(val).toLowerCase()
      if (s.includes('draft')) return 'bg-gray-100 text-gray-600'
      if (s.includes('submit') || s.includes('reserved')) return 'bg-emerald-50 text-emerald-700'
      if (s.includes('pending') || s.includes('transfer created')) return 'bg-amber-50 text-amber-700'
      if (s.includes('cancel') || s.includes('release')) return 'bg-red-50 text-red-700'
      if (s.includes('completed') || s.includes('sold')) return 'bg-blue-50 text-blue-700'
      return 'bg-gray-100 text-gray-600'
    },
  },
}
</script>
