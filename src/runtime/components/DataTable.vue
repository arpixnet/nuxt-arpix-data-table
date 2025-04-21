<template>
  <div
    class="arpix-data-table"
    :class="[`theme-${theme}`, `density-${density}`, tableClass]"
    :style="themeStyles"
  >
    <!-- Table Controls -->
    <div class="arpix-data-table-controls" v-if="showSearch || $slots.controls">
      <!-- Custom Controls Slot (Left Side) -->
      <div class="arpix-data-table-controls-left">
        <slot name="controls"></slot>
      </div>

      <!-- Search Input (Right Side) -->
      <div class="arpix-data-table-search" v-if="showSearch">
        <div class="arpix-data-table-search-container">
          <div class="arpix-data-table-search-input-wrapper">
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Search..."
              class="arpix-data-table-search-input"
              @keyup.enter="handleSearch"
            />
            <button
              v-if="searchQuery"
              class="arpix-data-table-search-clear"
              @click="clearSearch"
              title="Clear search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <button
            class="arpix-data-table-search-button"
            @click="handleSearch"
            title="Search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Table -->
    <div class="arpix-data-table-wrapper">
      <table class="arpix-data-table-table">
        <!-- Column definitions -->
        <colgroup>
          <col v-if="selectable" style="width: 40px;" />
          <col v-for="column in visibleColumns" :key="column.key" :style="getColumnStyle(column)" />
        </colgroup>

        <!-- Table Header -->
        <thead v-if="showHeader">
          <slot name="header" :columns="visibleColumns" :sort="sort" :filters="state?.filters || {}" :onSort="handleSort" :onFilterUpdate="handleFilterUpdate">
            <ArpixDataTableHeader
              :columns="visibleColumns"
              :sort="sort"
              :filters="state?.filters || {}"
              :selectable="selectable"
              :selected="selected"
              :items="displayItems"
              @sort="handleSort"
              @select-all="handleSelectAll"
              @update:filters="handleFilterUpdate"
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

          <slot name="empty" v-else-if="!displayItems || !displayItems.length">
            <tr class="arpix-data-table-empty-row">
              <td :colspan="visibleColumns.length" class="arpix-data-table-empty-cell">
                <div class="arpix-data-table-empty">{{ noDataText }}</div>
                <div class="arpix-data-table-debug">Debug: {{ debug }}</div>
              </td>
            </tr>
          </slot>

          <template v-else>
            <!-- Debug info -->
            <tr v-if="debug.displayItems === 0" class="arpix-data-table-debug-row">
              <td :colspan="visibleColumns.length" class="arpix-data-table-debug-cell">
                <div class="arpix-data-table-debug">
                  <p>No data to display. Debug information:</p>
                  <ul>
                    <li>Data source type: {{ debug.dataSourceType }}</li>
                    <li>Is array: {{ debug.isArray }}</li>
                    <li>Data length: {{ debug.dataLength }}</li>
                    <li>State items: {{ debug.stateItems }}</li>
                    <li>Display items: {{ debug.displayItems }}</li>
                    <li>Pagination: {{ debug.pagination }}</li>
                    <li>Loading: {{ debug.loading }}</li>
                    <li>Error: {{ debug.error }}</li>
                    <li>Data source: {{ debug.dataSource }}</li>
                    <li>Pagination type: {{ debug.paginationType }}</li>
                  </ul>
                </div>
              </td>
            </tr>
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
import { computed, ref, watch, onMounted } from 'vue'
import { useNuxtApp } from '#app'
import { useDatatable } from '../composables'
import type {
  TableConfig,
  TableColumn,
  SortConfig
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
  density?: 'normal' | 'compact'
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
  pagination: 'client',
  searchable: () => useNuxtApp().$arpixDataTable.config.searchable || true,
  selectable: false,
  tableClass: '',
  theme: () => useNuxtApp().$arpixDataTable.config.theme || 'default',
  density: 'normal',
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
  'filter-change': [filters: Record<string, any>]
  'selection-change': [selected: any[]]
  'row-click': [row: any, index: number]
  'cell-click': [value: any, key: string, row: any]
}>()

// Get slots for later use if needed
// const slots = useSlots()

// Create the table configuration
const tableConfig: TableConfig = {
  columns: props.columns,
  dataSource: props.dataSource,
  perPage: props.perPage,
  searchable: props.searchable,
  pagination: props.pagination,
  selectable: props.selectable,
  tableClass: props.tableClass,
  theme: props.theme,
  density: props.density,
  themeVars: props.themeVars,
  showHeader: props.showHeader,
  showFooter: props.showFooter,
  showPagination: props.showPagination,
  showSearch: props.showSearch,
  loading: props.loading,
  error: props.error,
  noDataText: props.noDataText,
  initialSort: props.initialSort,
  filters: props.initialFilters || {}
}

// Log the table configuration
console.log('Table config:', tableConfig)
console.log('Columns:', props.columns)

// Use the datatable composable
const {
  state,
  loadData,
  setPage,
  setSort,
  setSearch,
  setFilters,
  setSelected,
  getDisplayItems
} = useDatatable(tableConfig)

// Reactive references to state
const searchQuery = ref('')
const sort = computed(() => state.value.sort)
const pagination = computed(() => state.value.pagination)
const selected = computed(() => state.value.selected)

// Sync searchQuery with state.searchQuery
watch(() => state.value.searchQuery, (value: string) => {
  if (value !== searchQuery.value) {
    searchQuery.value = value
  }
})
const displayItems = computed(() => {
  const items = getDisplayItems()
  console.log('Display items:', items)
  return items
})

// Debug computed property
const debug = computed(() => {
  return {
    dataSourceType: typeof props.dataSource,
    isArray: Array.isArray(props.dataSource),
    dataLength: Array.isArray(props.dataSource) ? props.dataSource.length : 0,
    stateItems: state.value?.items?.length || 0,
    displayItems: displayItems.value ? displayItems.value.length : 0,
    firstItem: Array.isArray(props.dataSource) && props.dataSource.length > 0 ? props.dataSource[0] : null,
    searchQuery: searchQuery.value,
    stateSearchQuery: state.value?.searchQuery || '',
    searchable: props.searchable,
    sort: sort.value,
    filters: state.value?.filters || {},
    columns: visibleColumns.value.map(col => ({ key: col.key, sortable: col.sortable })),
    pagination: state.value?.pagination || { page: 1, perPage: props.perPage || 10, total: 0 },
    loading: state.value?.loading || false,
    error: state.value?.error || null,
    dataSource: props.dataSource,
    paginationType: props.pagination
  }
})

// Computed properties
const visibleColumns = computed(() =>
  props.columns.filter((col: TableColumn) => col.visible !== false)
)

// Get column style
const getColumnStyle = (column: TableColumn) => {
  const style: Record<string, string> = {}

  if (column.width) {
    style.width = column.width
  }

  return style
}

const themeStyles = computed(() => {
  const styles: Record<string, string> = {}

  if (props.themeVars) {
    Object.entries(props.themeVars).forEach(([key, value]) => {
      styles[`--arpix-${key}`] = value as string
    })
  }

  return styles
})

// Watch for changes in props
watch(() => props.loading, (value: boolean) => {
  state.value.loading = value
})

watch(() => props.error, (value: string) => {
  state.value.error = value
})

watch(() => searchQuery.value, (value: string) => {
  console.log('Search query changed:', value)
  // Use setSearch function to update the search query
  setSearch(value)
  emit('search-change', value)

  // Reset to first page when search changes is handled in setSearch

  // Force refresh of display items
  if (Array.isArray(props.dataSource)) {
    console.log('Refreshing display items after search')
    // The displayItems computed property will automatically update
    console.log('Display items after search:', displayItems.value?.length || 0)
  }
})

// Watch for changes in dataSource
watch(() => props.dataSource, (newValue) => {
  console.log('dataSource changed:', newValue)
  if (Array.isArray(newValue)) {
    state.value.items = [...newValue]
    console.log('Updated items from watcher:', state.value.items.length, 'items')
  } else {
    loadData()
  }
}, { deep: true })

// Watch for changes in columns
watch(() => props.columns, (newValue) => {
  console.log('columns changed:', newValue)
  tableConfig.columns = newValue
}, { deep: true })

// Event handlers
const handleSort = (column: TableColumn) => {
  if (!column.sortable) return

  console.log('Handling sort for column:', column.key)

  const newSort: SortConfig = {
    field: column.key,
    direction: sort.value?.field === column.key && sort.value?.direction === 'asc' ? 'desc' : 'asc'
  }

  console.log('New sort:', newSort)

  setSort(newSort)
  emit('sort-change', newSort)

  // Force refresh of display items
  console.log('Display items after sort:', displayItems.value?.length || 0)
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

// Handle search button click or enter key press
const handleSearch = () => {
  console.log('Search button clicked or enter pressed, query:', searchQuery.value)
  setSearch(searchQuery.value)
  emit('search-change', searchQuery.value)
}

// Clear search input and reset results
const clearSearch = () => {
  console.log('Clearing search')
  searchQuery.value = ''
  setSearch('')
  emit('search-change', '')
}

// Handle filter updates from the header
const handleFilterUpdate = (filters: Record<string, any>) => {
  console.log('Filter update:', filters)

  // Make sure state is initialized before updating filters
  if (state?.value) {
    setFilters(filters)
    emit('filter-change', filters)

    // Reset to first page when filters change
    if (pagination.value?.page !== 1) {
      setPage(1)
    }
  } else {
    console.warn('Cannot update filters: state is not initialized yet')
  }
}

// Handle select all checkbox
const handleSelectAll = (checked: boolean) => {
  if (!state?.value) {
    console.warn('Cannot select items: state is not initialized yet')
    return
  }

  if (checked) {
    // Select all items
    setSelected(displayItems.value || [])
  } else {
    // Deselect all items
    setSelected([])
  }

  emit('selection-change', state.value.selected || [])
}

// Initialize
onMounted(async () => {
  console.log('DataTable mounted, initializing with dataSource:', props.dataSource)

  // Set initial state
  if (state?.value && props.initialSort) {
    setSort(props.initialSort)
  }

  if (state?.value && props.initialPage && props.initialPage > 1) {
    setPage(props.initialPage)
  }

  // Make sure state is initialized
  if (!state?.value) {
    console.error('State is not initialized yet')
    return
  }

  // Direct assignment for array data sources to ensure data is loaded
  if (Array.isArray(props.dataSource)) {
    state.value.items = [...props.dataSource]
    console.log('Directly assigned array data:', state.value.items.length, 'items')
  } else if (typeof props.dataSource === 'string') {
    // Load data from API
    console.log('Loading data from API:', props.dataSource)
    try {
      await loadData()
      console.log('Data loaded from API:', state.value.items.length, 'items')
    } catch (error) {
      console.error('Error loading data from API:', error)
      state.value.error = error instanceof Error ? error.message : 'Failed to load data'
    }
  } else {
    // Load data from other sources
    await loadData()
    console.log('Data loaded:', state.value.items)
  }

  // Initialize search if needed
  if (state?.value && searchQuery.value) {
    setSearch(searchQuery.value)
  }

  // Initialize filters if provided
  if (state?.value && props.initialFilters) {
    setFilters(props.initialFilters)
  }
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

.arpix-data-table-controls-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.arpix-data-table-search {
  display: flex;
  justify-content: flex-end;
}

.arpix-data-table-search-container {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 300px;
}

.arpix-data-table-search-input-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}

.arpix-data-table-search-input {
  width: 100%;
  min-width: 200px;
  padding: 0.5rem 0.75rem;
  padding-right: 2rem;
  border: 1px solid var(--arpix-border-color);
  border-radius: 0.375rem 0 0 0.375rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.arpix-data-table-search-input:focus {
  border-color: var(--arpix-primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.arpix-data-table-search-clear {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: var(--arpix-secondary-color);
  color: white;
  border: none;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.arpix-data-table-search-clear:hover {
  opacity: 1;
}

.arpix-data-table-search-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  width: 36px;
  background-color: var(--arpix-primary-color);
  color: white;
  border: none;
  border-radius: 0 0.375rem 0.375rem 0;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.arpix-data-table-search-button:hover {
  background-color: var(--arpix-primary-color-dark, #2563eb);
}

.arpix-data-table-search-button:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4);
}

/* Responsive styles for mobile */
@media (max-width: 640px) {
  .arpix-data-table-controls {
    flex-direction: column;
    gap: 1rem;
  }

  .arpix-data-table-search {
    width: 100%;
    justify-content: center;
  }

  .arpix-data-table-search-container {
    max-width: 100%;
  }
}

.arpix-data-table-wrapper {
  overflow-x: auto;
  position: relative;
  z-index: 1;
}

.arpix-data-table-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  border-spacing: 0;
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

.arpix-data-table-debug {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--arpix-secondary-color);
  opacity: 0.9;
  text-align: left;
}

.arpix-data-table-debug p {
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.arpix-data-table-debug ul {
  list-style-type: none;
  padding-left: 0.5rem;
}

.arpix-data-table-debug li {
  margin-bottom: 0.25rem;
}

.arpix-data-table-debug-row {
  background-color: rgba(255, 244, 229, 0.7);
}

.arpix-data-table-debug-cell {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid var(--arpix-border-color);
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

/* Ensure consistent cell widths */
.arpix-data-table-table th,
.arpix-data-table-table td {
  box-sizing: border-box;
  width: auto;
  text-align: left;
}

/* Set width for specific columns */
.arpix-data-table-table th[style*="width"],
.arpix-data-table-table td[style*="width"] {
  min-width: auto;
  max-width: none;
}

/* Ensure column alignment */
.arpix-data-table-table colgroup {
  display: table-column-group;
}

.arpix-data-table-table col {
  display: table-column;
}

/* Selection cell has fixed width */
.arpix-data-table-selection-cell {
  width: 40px !important;
  min-width: 40px !important;
  max-width: 40px !important;
}

/* Theme: default - styles already defined in base styles */

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
