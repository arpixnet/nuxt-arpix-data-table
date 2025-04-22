<template>
  <div
    class="arpix-data-table"
    :class="[`theme-${theme}`, `density-${density}`, tableClass, {'mobile-card-view': mobileCardViewEnabled}]"
    :style="themeStyles"
  >
    <!-- Table Controls -->
    <div class="arpix-data-table-controls" v-if="showSearch || $slots.controls">
      <!-- Custom Controls Slot (Left Side) -->
      <div class="arpix-data-table-controls-left">
        <slot name="controls"></slot>
      </div>

      <!-- View Toggle -->
      <div class="arpix-data-table-mobile-toggle" v-if="isMobileOrTablet">
        <div class="arpix-data-table-view-buttons">
          <button
            class="arpix-data-table-view-button"
            :class="{ 'active': !mobileCardViewEnabled }"
            @click="mobileCardViewEnabled = false"
            title="Table View"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16">
              <path fill="currentColor" fill-rule="evenodd" d="M13.5 4v1a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1M15 5V4a2.5 2.5 0 0 0-2.5-2.5h-9A2.5 2.5 0 0 0 1 4v1a2.5 2.5 0 0 0 2.5 2.5h9A2.5 2.5 0 0 0 15 5m-1.5 6v1a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1m1.5 1v-1a2.5 2.5 0 0 0-2.5-2.5h-9A2.5 2.5 0 0 0 1 11v1a2.5 2.5 0 0 0 2.5 2.5h9A2.5 2.5 0 0 0 15 12" clip-rule="evenodd"/>
            </svg>
          </button>
          <button
            class="arpix-data-table-view-button"
            :class="{ 'active': mobileCardViewEnabled }"
            @click="mobileCardViewEnabled = true"
            title="Card View"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                <rect width="7" height="7" x="3" y="3" rx="1"/>
                <rect width="7" height="7" x="3" y="14" rx="1"/>
                <rect width="7" height="7" x="14" y="3" rx="1"/>
                <rect width="7" height="7" x="14" y="14" rx="1"/>
              </g>
            </svg>
          </button>
        </div>
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
          <col v-if="selectable" style="width: 50px; min-width: 50px;" />
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
              :debug="props.debug"
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
              <td :colspan="selectable ? visibleColumns.length + 1 : visibleColumns.length" class="arpix-data-table-loading-cell">
                <div class="arpix-data-table-loading">Loading...</div>
              </td>
            </tr>
          </slot>

          <slot name="error" v-else-if="error">
            <tr class="arpix-data-table-error-row">
              <td :colspan="selectable ? visibleColumns.length + 1 : visibleColumns.length" class="arpix-data-table-error-cell">
                <div class="arpix-data-table-error">{{ error }}</div>
              </td>
            </tr>
          </slot>

          <slot name="empty" v-else-if="!displayItems || !displayItems.length">
            <tr class="arpix-data-table-empty-row">
              <td :colspan="selectable ? visibleColumns.length + 1 : visibleColumns.length" class="arpix-data-table-empty-cell">
                <div class="arpix-data-table-empty">
                  <div class="arpix-data-table-empty-content">
                    <div class="arpix-data-table-empty-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 512 512">
                        <path fill="currentColor" d="m426.645 273.941l.022 99.392l-170.667 96l-170.667-96l-.021-97.749l42.667 24.939l.021 47.85l106.667 59.99l-.022-74.027l21.502-13.189l21.165 13.018l.021 74.198L384 348.352l-.021-49.493zM208.019 57.681l47.391 27.99l.59-.338l.263.146l44.881-26.492l179.404 104.569l-45.042 27.651l45.05 26.593l-180.519 105.42l-44.008-27.032l-45.39 27.898l-180.518-105.42l46.046-27.203l-47.552-29.212zM406.934 192l-151.039-83.072L107.892 192l148.003 83.072z"/>
                      </svg>
                    </div>
                    <div class="arpix-data-table-empty-text">{{ noDataText }}</div>
                  </div>
                </div>
                <div class="arpix-data-table-debug" v-if="props.debug && debug.displayItems === 0">Debug: {{ debug }}</div>
              </td>
            </tr>
          </slot>

          <template v-else>
            <!-- Debug info -->
            <tr v-if="props.debug && debug.displayItems === 0" class="arpix-data-table-debug-row">
              <td :colspan="selectable ? visibleColumns.length + 1 : visibleColumns.length" class="arpix-data-table-debug-cell">
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
          <tr>
            <td :colspan="selectable ? visibleColumns.length + 1 : visibleColumns.length">
              <div class="arpix-data-table-footer">
                <slot
                  name="footer"
                >
                  <!-- Custom Footer Content -->
                </slot>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Pagination -->
    <div
      v-if="showPagination"
      class="arpix-data-table-pagination-wrapper"
    >
      <slot
        name="pagination"
        :pagination="pagination"
        :on-page-change="handlePageChange"
      >
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
  debug?: boolean

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
  debug: () => useNuxtApp().$arpixDataTable.config.debug || false,
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
  filters: props.initialFilters || {},
  debug: props.debug
}

// Log the table configuration if debug mode is enabled
if (props.debug) {
  console.log('Table config:', tableConfig)
  console.log('Columns:', props.columns)
}

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

// Card view state
const mobileCardViewEnabled = ref(false) // Default to table view

// Check if we're on mobile or tablet
const isMobileOrTablet = computed(() => {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= 1024
})

// Sync searchQuery with state.searchQuery
watch(() => state.value.searchQuery, (value: string) => {
  if (value !== searchQuery.value) {
    searchQuery.value = value
  }
})
const displayItems = computed(() => {
  const items = getDisplayItems()
  if (props.debug) {
    console.log('Display items:', items)
  }
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
    style.minWidth = column.width // Add minWidth to ensure the column respects the width
  } else {
    style.width = '180px' // Default width for columns without specified width
    style.minWidth = '180px' // Default minimum width for columns without specified width
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
  if (props.debug) {
    console.log('Search query changed:', value)
  }
  // Use setSearch function to update the search query
  setSearch(value)
  emit('search-change', value)

  // Reset to first page when search changes is handled in setSearch

  // Force refresh of display items
  if (Array.isArray(props.dataSource) && props.debug) {
    console.log('Refreshing display items after search')
    // The displayItems computed property will automatically update
    console.log('Display items after search:', displayItems.value?.length || 0)
  }
})

// Watch for changes in dataSource
watch(() => props.dataSource, (newValue) => {
  if (props.debug) {
    console.log('dataSource changed:', newValue)
  }
  if (Array.isArray(newValue)) {
    state.value.items = [...newValue]
    if (props.debug) {
      console.log('Updated items from watcher:', state.value.items.length, 'items')
    }
  } else {
    loadData()
  }
}, { deep: true })

// Watch for changes in columns
watch(() => props.columns, (newValue) => {
  if (props.debug) {
    console.log('columns changed:', newValue)
  }
  tableConfig.columns = newValue
}, { deep: true })

// Event handlers
const handleSort = (column: TableColumn) => {
  if (!column.sortable) return

  if (props.debug) {
    console.log('Handling sort for column:', column.key)
  }

  const newSort: SortConfig = {
    field: column.key,
    direction: sort.value?.field === column.key && sort.value?.direction === 'asc' ? 'desc' : 'asc'
  }

  if (props.debug) {
    console.log('New sort:', newSort)
  }

  setSort(newSort)
  emit('sort-change', newSort)

  // Force refresh of display items
  if (props.debug) {
    console.log('Display items after sort:', displayItems.value?.length || 0)
  }
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
  if (props.debug) {
    console.log('Search button clicked or enter pressed, query:', searchQuery.value)
  }
  setSearch(searchQuery.value)
  emit('search-change', searchQuery.value)
}

// Clear search input and reset results
const clearSearch = () => {
  if (props.debug) {
    console.log('Clearing search')
  }
  searchQuery.value = ''
  setSearch('')
  emit('search-change', '')
}

// Handle filter updates from the header
const handleFilterUpdate = (filters: Record<string, any>) => {
  if (props.debug) {
    console.log('Filter update:', filters)
  }

  // Make sure state is initialized before updating filters
  if (state?.value) {
    setFilters(filters)
    emit('filter-change', filters)

    // Reset to first page when filters change
    if (pagination.value?.page !== 1) {
      setPage(1)
    }
  } else if (props.debug) {
    console.warn('Cannot update filters: state is not initialized yet')
  }
}

// Handle select all checkbox
const handleSelectAll = (checked: boolean) => {
  if (!state?.value) {
    if (props.debug) {
      console.warn('Cannot select items: state is not initialized yet')
    }
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
  if (props.debug) {
    console.log('DataTable mounted, initializing with dataSource:', props.dataSource)
  }

  // Set initial state
  if (state?.value && props.initialSort) {
    setSort(props.initialSort)
  }

  if (state?.value && props.initialPage && props.initialPage > 1) {
    setPage(props.initialPage)
  }

  // Make sure state is initialized
  if (!state?.value) {
    if (props.debug) {
      console.error('State is not initialized yet')
    }
    return
  }

  // Direct assignment for array data sources to ensure data is loaded
  if (Array.isArray(props.dataSource)) {
    state.value.items = [...props.dataSource]
    if (props.debug) {
      console.log('Directly assigned array data:', state.value.items.length, 'items')
    }
  } else if (typeof props.dataSource === 'string') {
    // Load data from API
    if (props.debug) {
      console.log('Loading data from API:', props.dataSource)
    }
    try {
      await loadData()
      if (props.debug) {
        console.log('Data loaded from API:', state.value.items.length, 'items')
      }
    } catch (error) {
      if (props.debug) {
        console.error('Error loading data from API:', error)
      }
      state.value.error = error instanceof Error ? error.message : 'Failed to load data'
    }
  } else {
    // Load data from other sources
    await loadData()
    if (props.debug) {
      console.log('Data loaded:', state.value.items)
    }
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

/* View toggle buttons */
.arpix-data-table-mobile-toggle {
  display: none; /* Hidden by default */
  justify-content: center;
  margin: 0 1rem 0.5rem 0;
}

/* Only show toggle buttons on mobile and tablet */
@media (max-width: 1024px) {
  .arpix-data-table-mobile-toggle {
    display: flex;
  }
}

.arpix-data-table-view-buttons {
  display: flex;
  gap: 0.5rem;
}

.arpix-data-table-view-button {
  background-color: #f1f5f9;
  color: #888888;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.arpix-data-table-view-button:hover {
  background-color: #e2e8f0;
  color: #666666;
}

.arpix-data-table-view-button.active {
  background-color: var(--arpix-primary-color);
  color: white;
  border-color: var(--arpix-primary-color);
}

/* Responsive styles for mobile */
@media (max-width: 640px) {
  .arpix-data-table-view-button {
    width: 36px;
    height: 36px;
  }

  .arpix-data-table-view-button svg {
    width: 20px;
    height: 20px;
  }
}

/* Responsive styles for mobile and tablet */
@media (max-width: 1024px) {
  .arpix-data-table-controls {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .arpix-data-table-controls-left {
    order: 2;
    flex: 1;
  }

  .arpix-data-table-mobile-toggle {
    order: 1;
    margin: 0;
  }

  .arpix-data-table-search {
    order: 3;
    width: 100%;
    justify-content: center;
  }

  .arpix-data-table-search-container {
    max-width: 100%;
  }

  /* Improve touch targets for mobile */
  .arpix-data-table-search-input {
    padding: 0.6rem 0.75rem;
    padding-right: 2.5rem;
    font-size: 1rem;
  }

  .arpix-data-table-search-button {
    height: 42px;
    width: 42px;
  }

  /* Add some spacing around the table */
  .arpix-data-table {
    padding-bottom: 0.5rem;
  }

  /* Improve scrolling experience */
  .arpix-data-table-wrapper {
    margin: 0;
    padding: 0;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
    max-width: 100%;
  }


}

.arpix-data-table-wrapper {
  overflow-x: auto;
  position: relative;
  z-index: 1;
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
  scrollbar-width: thin; /* Firefox */
  width: 100%;
}

.arpix-data-table-wrapper table {
  width: 100%;
  min-width: 100%;
  table-layout: fixed; /* Use fixed layout to respect column widths */
}

/* Ensure table is wide enough on mobile and tablet */
@media (max-width: 1024px) {
  /* Normal table view - force horizontal scrolling */
  .arpix-data-table-wrapper table {
    min-width: 800px; /* Force horizontal scrolling on mobile */
    table-layout: fixed; /* Keep fixed layout to respect column widths */
  }

  /* Card view - prevent horizontal scrolling */
  .mobile-card-view .arpix-data-table-wrapper table,
  .mobile-card-view .arpix-data-table-wrapper tfoot,
  .mobile-card-view .arpix-data-table-wrapper tbody,
  .mobile-card-view .arpix-data-table-wrapper tr,
  .mobile-card-view .arpix-data-table-wrapper td {
    min-width: 100% !important;
    max-width: 100% !important;
    width: 100% !important;
    table-layout: auto !important;
    box-sizing: border-box !important;
  }
}

/* Custom scrollbar for Webkit browsers */
.arpix-data-table-wrapper::-webkit-scrollbar {
  height: 6px;
}

.arpix-data-table-wrapper::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.arpix-data-table-wrapper::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.arpix-data-table-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.arpix-data-table-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  border-spacing: 0;
  box-sizing: border-box;
}

.arpix-data-table-loading-cell,
.arpix-data-table-error-cell {
  padding: 2rem;
  text-align: center;
}

.arpix-data-table-empty-cell {
  padding: 0;
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
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
  width: 100%;
}

.arpix-data-table-empty-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.arpix-data-table-empty-icon {
  color: #888888;
}

.arpix-data-table-empty-icon svg {
  width: 64px;
  height: 64px;
  opacity: 0.8;
}

.arpix-data-table-empty-text {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--arpix-text-color);
  margin-left: 0.75rem;
}

/* Dark theme empty state */
.arpix-data-table.theme-dark .arpix-data-table-empty-icon {
  color: #94a3b8;
}

.arpix-data-table-debug {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #4b5563; /* Darker text color for better readability */
  text-align: left;
  padding: 0.5rem 1.5rem;
  background-color: #fff4e5;
  border-radius: 0.25rem;
}

.arpix-data-table-debug p {
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #374151; /* Even darker for headings */
}

.arpix-data-table-debug ul {
  list-style-type: none;
  padding-left: 0.5rem;
}

.arpix-data-table-debug li {
  margin-bottom: 0.25rem;
  color: #4b5563; /* Consistent with parent */
}

.arpix-data-table-debug-row {
  background-color: #fff4e5;
}

.arpix-data-table-debug-cell {
  padding: 1rem 1.5rem;
  text-align: left;
  border-bottom: 1px solid var(--arpix-border-color);
  color: #4b5563;
}

.arpix-data-table-footer {
  padding: 0;
  border-top: 1px solid var(--arpix-border-color);
}

/* Footer styles in card view on mobile (hidden by tfoot display:none) */
.mobile-card-view .arpix-data-table-footer {
  display: none;
}

/* These styles won't apply since tfoot is hidden in card view, but keeping for consistency */
.mobile-card-view tfoot tr,
.mobile-card-view tfoot td {
  display: none;
}

.arpix-data-table-pagination-wrapper {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--arpix-border-color);
  display: flex;
  justify-content: center;
}

/* Ensure pagination wrapper is full width in card view on mobile */
.mobile-card-view .arpix-data-table-pagination-wrapper {
  width: 100%;
  box-sizing: border-box;
}

/* Ensure consistent cell widths */
.arpix-data-table-table th,
.arpix-data-table-table td {
  box-sizing: border-box;
  width: 180px;
  min-width: 180px;
  text-align: left;
}

/* Set width for specific columns */
.arpix-data-table-table th[style*="width"],
.arpix-data-table-table td[style*="width"] {
  width: attr(style width) !important;
  min-width: attr(style width) !important;
  max-width: none !important;
}

/* Ensure column alignment */
.arpix-data-table-table colgroup {
  display: table-column-group;
}

.arpix-data-table-table col {
  display: table-column;
}

/* Set default width for columns without specified width */
.arpix-data-table-table col:not([style*="width"]) {
  width: 180px !important;
  min-width: 180px !important;
}

/* Fix for tables with selectable=true and columns with visible=false */
.arpix-data-table-table tr > *:last-child {
  border-right: none;
}

/* Fix for tables with selectable=true and columns with visible=false */
.arpix-data-table-table tr > td:empty,
.arpix-data-table-table tr > th:empty {
  display: none;
}

/* Selection cell has fixed width */
.arpix-data-table-selection-cell {
  width: 50px !important;
  min-width: 50px !important;
  max-width: 50px !important;
}

@media (max-width: 1024px) {
  .arpix-data-table-selection-cell {
    width: 60px !important;
    min-width: 60px !important;
    max-width: 60px !important;
  }
}

/* Theme: default - styles already defined in base styles */

/* Mobile card view styles */
.mobile-card-view {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

.mobile-card-view .arpix-data-table-wrapper {
  overflow-x: visible;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 0.5rem 1rem;
}

/* Ensure table footer is properly displayed in card view */
.mobile-card-view .arpix-data-table-table {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.mobile-card-view .arpix-data-table-table tfoot {
  display: none;
}

/* Status badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.15rem 0.8rem !important; /* Use !important to ensure this padding is applied */
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
  border: 1px solid;
}

/* Predefined status styles */
.status-completed {
  background-color: #dcfce7;
  color: #166534;
  border-color: #166534;
}

.status-pending {
  background-color: #fef9c3;
  color: #854d0e;
  border-color: #854d0e;
}

.status-cancelled {
  background-color: #fee2e2;
  color: #991b1b;
  border-color: #991b1b;
}

/* Additional common status styles */
.status-active {
  background-color: #dbeafe;
  color: #1e40af;
  border-color: #1e40af;
}

.status-inactive {
  background-color: #e5e7eb;
  color: #4b5563;
  border-color: #4b5563;
}

/* Generic status styles for other values */
.status-badge:not(.status-completed):not(.status-pending):not(.status-cancelled):not(.status-active):not(.status-inactive) {
  background-color: #f3f4f6;
  color: #374151;
  border-color: #374151;
}

/* Boolean icons */
.boolean-icon {
  display: inline-block;
  font-size: 1.25rem;
  font-weight: bold;
  line-height: 1;
}

.boolean-true {
  color: #16a34a;
}

.boolean-false {
  color: #dc2626;
}

@media (max-width: 640px) {
  .boolean-icon {
    font-size: 1.5rem;
  }
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

/* Dark theme status badges */
.arpix-data-table.theme-dark .status-completed {
  background-color: rgba(22, 101, 52, 0.2);
  color: #4ade80;
  border-color: #4ade80;
}

.arpix-data-table.theme-dark .status-pending {
  background-color: rgba(133, 77, 14, 0.2);
  color: #facc15;
  border-color: #facc15;
}

.arpix-data-table.theme-dark .status-cancelled {
  background-color: rgba(153, 27, 27, 0.2);
  color: #f87171;
  border-color: #f87171;
}

.arpix-data-table.theme-dark .status-active {
  background-color: rgba(30, 64, 175, 0.2);
  color: #60a5fa;
  border-color: #60a5fa;
}

.arpix-data-table.theme-dark .status-inactive {
  background-color: rgba(75, 85, 99, 0.2);
  color: #9ca3af;
  border-color: #9ca3af;
}

/* Generic dark theme status styles for other values */
.arpix-data-table.theme-dark .status-badge:not(.status-completed):not(.status-pending):not(.status-cancelled):not(.status-active):not(.status-inactive) {
  background-color: rgba(55, 65, 81, 0.2);
  color: #d1d5db;
  border-color: #d1d5db;
}

/* Dark theme footer styles */
.arpix-data-table.theme-dark tfoot {
  background-color: var(--arpix-background-color);
  color: var(--arpix-text-color);
}

.arpix-data-table.theme-dark tfoot td {
  background-color: var(--arpix-background-color);
  color: var(--arpix-text-color);
}

.arpix-data-table.theme-dark .arpix-data-table-footer {
  background-color: var(--arpix-background-color);
  color: var(--arpix-text-color);
  border-top: 1px solid var(--arpix-border-color);
}

/* Ensure custom content in footer also gets dark theme styles */
.arpix-data-table.theme-dark .arpix-data-table-footer * {
  color: var(--arpix-text-color);
}

.arpix-data-table.theme-dark .arpix-data-table-footer a {
  color: var(--arpix-primary-color);
}

.arpix-data-table.theme-dark .arpix-data-table-footer button:not([class*="primary"]) {
  background-color: var(--arpix-header-background);
  color: var(--arpix-text-color);
  border-color: var(--arpix-border-color);
}

/* Dark theme pagination styles */
.arpix-data-table.theme-dark .arpix-data-table-pagination-wrapper {
  background-color: var(--arpix-background-color);
  color: var(--arpix-text-color);
  border-top: 1px solid var(--arpix-border-color);
}

/* Dark theme boolean icons */
.arpix-data-table.theme-dark .boolean-true {
  color: #4ade80;
}

.arpix-data-table.theme-dark .boolean-false {
  color: #f87171;
}
</style>
