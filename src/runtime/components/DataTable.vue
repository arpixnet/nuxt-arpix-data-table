<template>
  <div
    class="arpix-data-table"
    :class="[`theme-${theme}`, tableClass]"
    :style="themeStyles"
  >
    <!-- Table Controls -->
    <div class="arpix-data-table-controls" v-if="showSearch || $slots.controls">
      <!-- Search Input -->
      <div class="arpix-data-table-search" v-if="showSearch">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search..."
          class="arpix-data-table-search-input"
        />
      </div>

      <!-- Custom Controls Slot -->
      <slot name="controls"></slot>
    </div>

    <!-- Main Table -->
    <div class="arpix-data-table-wrapper">
      <table class="arpix-data-table-table">
        <!-- Table Header -->
        <thead v-if="showHeader">
          <slot name="header" :columns="visibleColumns" :sort="sort" :onSort="handleSort">
            <ArpixDataTableHeader
              :columns="visibleColumns"
              :sort="sort"
              @sort="handleSort"
            />
          </slot>
        </thead>

        <!-- Table Body -->
        <tbody>
          <slot name="loading" v-if="loading">
            <tr class="arpix-data-table-loading-row">
              <td :colspan="visibleColumns.length" class="arpix-data-table-loading-cell">
                <div class="arpix-data-table-loading">Loading...</div>
              </td>
            </tr>
          </slot>

          <slot name="error" v-else-if="error">
            <tr class="arpix-data-table-error-row">
              <td :colspan="visibleColumns.length" class="arpix-data-table-error-cell">
                <div class="arpix-data-table-error">{{ error }}</div>
              </td>
            </tr>
          </slot>

          <slot name="empty" v-else-if="!displayItems.length">
            <tr class="arpix-data-table-empty-row">
              <td :colspan="visibleColumns.length" class="arpix-data-table-empty-cell">
                <div class="arpix-data-table-empty">{{ noDataText }}</div>
              </td>
            </tr>
          </slot>

          <template v-else>
            <slot name="body" :items="displayItems" :columns="visibleColumns" :selected="selected">
              <ArpixDataTableBody
                :items="displayItems"
                :columns="visibleColumns"
                :selectable="selectable"
                :selected="selected"
                @select="handleSelect"
                @row-click="handleRowClick"
                @cell-click="handleCellClick"
              />
            </slot>
          </template>
        </tbody>

        <!-- Table Footer -->
        <tfoot v-if="showFooter">
          <slot name="footer" :columns="visibleColumns">
            <tr>
              <td :colspan="visibleColumns.length">
                <div class="arpix-data-table-footer">
                  <!-- Custom Footer Content -->
                </div>
              </td>
            </tr>
          </slot>
        </tfoot>
      </table>
    </div>

    <!-- Pagination -->
    <div class="arpix-data-table-pagination-wrapper" v-if="showPagination">
      <slot name="pagination" :pagination="pagination" :onPageChange="handlePageChange">
        <ArpixDataTablePagination
          :pagination="pagination"
          @page-change="handlePageChange"
        />
      </slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch, onMounted, useSlots } from 'vue'
import { useNuxtApp } from '#app'
import { useDatatable } from '../composables'
import type {
  TableConfig,
  TableColumn,
  SortConfig,
  PaginationConfig,
  TableState
} from '../types'

// Define props
const props = withDefaults(defineProps<{
  // Main configuration
  columns: TableColumn[]
  dataSource: any

  // Pagination options
  perPage?: number
  pagination?: 'client' | 'server'

  // Features
  searchable?: boolean
  selectable?: boolean

  // UI options
  tableClass?: string
  theme?: string
  themeVars?: Record<string, string>
  showHeader?: boolean
  showFooter?: boolean
  showPagination?: boolean
  showSearch?: boolean

  // State
  loading?: boolean
  error?: string
  noDataText?: string

  // Initial state
  initialSort?: SortConfig
  initialFilters?: Record<string, any>
  initialPage?: number
}>(), {
  perPage: () => useNuxtApp().$arpixDataTable.config.perPage || 10,
  pagination: () => useNuxtApp().$arpixDataTable.config.paginationType || 'client',
  searchable: () => useNuxtApp().$arpixDataTable.config.searchable || true,
  selectable: false,
  tableClass: '',
  theme: () => useNuxtApp().$arpixDataTable.config.theme || 'default',
  themeVars: () => ({}),
  showHeader: true,
  showFooter: true,
  showPagination: true,
  showSearch: true,
  loading: false,
  error: '',
  noDataText: 'No data available',
  initialPage: 1
})

// Define emits
const emit = defineEmits<{
  'update:loading': [value: boolean]
  'update:error': [value: string]
  'page-change': [page: number]
  'sort-change': [sort: SortConfig]
  'search-change': [query: string]
  'selection-change': [selected: any[]]
  'row-click': [row: any, index: number]
  'cell-click': [value: any, key: string, row: any]
}>()

// Get slots
const slots = useSlots()

// Create the table configuration
const tableConfig = computed<TableConfig>(() => ({
  columns: props.columns,
  dataSource: props.dataSource,
  perPage: props.perPage,
  searchable: props.searchable,
  pagination: props.pagination,
  selectable: props.selectable,
  tableClass: props.tableClass,
  theme: props.theme,
  themeVars: props.themeVars,
  showHeader: props.showHeader,
  showFooter: props.showFooter,
  showPagination: props.showPagination,
  showSearch: props.showSearch,
  loading: props.loading,
  error: props.error,
  noDataText: props.noDataText,
  initialSort: props.initialSort
}))

// Use the datatable composable
const {
  state,
  loadData,
  setPage,
  setSort,
  setSearch,
  setSelected,
  getDisplayItems
} = useDatatable(tableConfig)

// Reactive references to state
const searchQuery = ref('')
const sort = computed(() => state.value.sort)
const pagination = computed(() => state.value.pagination)
const selected = computed(() => state.value.selected)
const displayItems = computed(() => getDisplayItems())

// Computed properties
const visibleColumns = computed(() =>
  props.columns.filter(col => col.visible !== false)
)

const themeStyles = computed(() => {
  const styles: Record<string, string> = {}

  if (props.themeVars) {
    Object.entries(props.themeVars).forEach(([key, value]) => {
      styles[`--arpix-${key}`] = value
    })
  }

  return styles
})

// Watch for changes in props
watch(() => props.loading, (value) => {
  state.value.loading = value
})

watch(() => props.error, (value) => {
  state.value.error = value
})

watch(() => searchQuery.value, (value) => {
  state.value.searchQuery = value
  emit('search-change', value)

  // Reset to first page when search changes
  if (pagination.value.page !== 1) {
    setPage(1)
  }
})

// Event handlers
const handleSort = (column: TableColumn) => {
  if (!column.sortable) return

  const newSort: SortConfig = {
    field: column.key,
    direction: sort.value?.field === column.key && sort.value?.direction === 'asc' ? 'desc' : 'asc'
  }

  setSort(newSort)
  emit('sort-change', newSort)
}

const handlePageChange = (page: number) => {
  setPage(page)
  emit('page-change', page)
}

const handleSelect = (items: any[]) => {
  setSelected(items)
  emit('selection-change', items)
}

const handleRowClick = (row: any, index: number) => {
  emit('row-click', row, index)
}

const handleCellClick = (value: any, key: string, row: any) => {
  emit('cell-click', value, key, row)
}

// Initialize
onMounted(() => {
  // Set initial state
  if (props.initialSort) {
    setSort(props.initialSort)
  }

  if (props.initialPage && props.initialPage > 1) {
    setPage(props.initialPage)
  }

  // Load data
  loadData()
})
</script>

<style>
.arpix-data-table {
  --arpix-primary-color: #3b82f6;
  --arpix-secondary-color: #64748b;
  --arpix-border-color: #e2e8f0;
  --arpix-background-color: #ffffff;
  --arpix-hover-color: #f8fafc;
  --arpix-text-color: #1e293b;
  --arpix-header-background: #f1f5f9;
  --arpix-header-text-color: #334155;
  --arpix-loading-color: #94a3b8;
  --arpix-error-color: #ef4444;
  --arpix-success-color: #22c55e;
  --arpix-warning-color: #f59e0b;
  --arpix-info-color: #0ea5e9;

  width: 100%;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: var(--arpix-text-color);
  background-color: var(--arpix-background-color);
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.arpix-data-table-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--arpix-border-color);
}

.arpix-data-table-search-input {
  width: 100%;
  min-width: 250px;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--arpix-border-color);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.arpix-data-table-search-input:focus {
  border-color: var(--arpix-primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.arpix-data-table-wrapper {
  overflow-x: auto;
}

.arpix-data-table-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
}

.arpix-data-table-loading-cell,
.arpix-data-table-error-cell,
.arpix-data-table-empty-cell {
  padding: 2rem;
  text-align: center;
}

.arpix-data-table-loading {
  color: var(--arpix-loading-color);
}

.arpix-data-table-error {
  color: var(--arpix-error-color);
}

.arpix-data-table-empty {
  color: var(--arpix-secondary-color);
}

.arpix-data-table-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--arpix-border-color);
}

.arpix-data-table-pagination-wrapper {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--arpix-border-color);
  display: flex;
  justify-content: center;
}

/* Theme: default */
.arpix-data-table.theme-default {
  /* Default theme styles are already defined in the base styles */
}

/* Theme: dark */
.arpix-data-table.theme-dark {
  --arpix-primary-color: #3b82f6;
  --arpix-secondary-color: #94a3b8;
  --arpix-border-color: #334155;
  --arpix-background-color: #1e293b;
  --arpix-hover-color: #334155;
  --arpix-text-color: #f1f5f9;
  --arpix-header-background: #0f172a;
  --arpix-header-text-color: #e2e8f0;
  --arpix-loading-color: #64748b;
  --arpix-error-color: #f87171;
  --arpix-success-color: #4ade80;
  --arpix-warning-color: #fbbf24;
  --arpix-info-color: #38bdf8;
}
</style>
