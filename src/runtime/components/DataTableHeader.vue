<template>
  <!-- Main Header Row -->
  <tr class="arpix-data-table-header-row">
    <!-- Selection Checkbox Column -->
    <th v-if="selectable" class="arpix-data-table-header-cell arpix-data-table-selection-cell">
      <input
        type="checkbox"
        :checked="allSelected"
        :indeterminate="someSelected && !allSelected"
        @change="toggleSelectAll"
        class="arpix-data-table-select-all"
      />
    </th>

    <!-- Regular Columns -->
    <th
      v-for="column in columns"
      :key="column.key"
      class="arpix-data-table-header-cell"
      :class="[
        column.class,
        { 'arpix-data-table-sortable': column.sortable },
        { 'arpix-data-table-sorted': isSorted(column) },
        { 'arpix-data-table-filtered': isFiltered(column) }
      ]"
      :style="getColumnStyle(column)"
    >
      <div
        class="arpix-data-table-header-content"
        @click="handleSort(column)"
      >
        <div class="arpix-data-table-header-title">
          <span class="arpix-data-table-header-label">{{ column.label }}</span>

          <!-- Filter Button (if column is filterable) -->
          <DataTableColumnFilter
            v-if="column.filterable !== false"
            :column="column"
            :active-filters="filters"
            @update:filter="handleFilterUpdate"
          />
        </div>

        <div class="arpix-data-table-header-actions">
          <!-- Sort Indicator -->
          <span
            v-if="column.sortable"
            class="arpix-data-table-sort-icon"
            :class="{
              'arpix-data-table-sort-asc': isSortedAsc(column),
              'arpix-data-table-sort-desc': isSortedDesc(column)
            }"
          >
            <svg v-if="isSortedAsc(column)" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m18 15-6-6-6 6"/>
            </svg>
            <svg v-else-if="isSortedDesc(column)" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.3">
              <path d="m18 15-6-6-6 6"/>
            </svg>
          </span>
        </div>
      </div>
    </th>
  </tr>

  <!-- Active Filters Summary Row (shown only when filters are active) -->
  <tr v-if="hasActiveFilters" class="arpix-data-table-filters-row">
    <th :colspan="selectable ? columns.length + 1 : columns.length" class="arpix-data-table-filters-cell">
      <div class="arpix-data-table-active-filters">
        <span class="arpix-data-table-filters-label">Active filters:</span>
        <div class="arpix-data-table-filter-tags">
          <div
            v-for="(filter, key) in filters"
            :key="key"
            class="arpix-data-table-filter-tag"
          >
            <span class="arpix-data-table-filter-tag-label">
              {{ getColumnLabel(String(key)) }}:
              <span class="arpix-data-table-filter-tag-value">
                {{ getFilterDisplayValue(String(key), filter) }}
              </span>
            </span>
            <button
              class="arpix-data-table-filter-tag-remove"
              @click="handleFilterUpdate(String(key), null)"
              title="Remove filter"
            >
              ×
            </button>
          </div>
        </div>
        <button
          v-if="Object.keys(filters).length > 1"
          class="arpix-data-table-clear-filters"
          @click="clearAllFilters"
        >
          Clear all
        </button>
      </div>
    </th>
  </tr>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { TableColumn, SortConfig, FilterConfig, FilterSet } from '../types'
import DataTableColumnFilter from './DataTableColumnFilter.vue'
import { format, parse, isValid, parseISO } from 'date-fns'

// Define props
const props = defineProps<{
  columns: TableColumn[]
  sort: SortConfig | null
  filters: FilterSet
  selectable?: boolean
  selected?: any[]
  items?: any[]
}>()

// Define emits
const emit = defineEmits<{
  'sort': [column: TableColumn]
  'select-all': [selected: boolean]
  'update:filters': [filters: FilterSet]
}>()

// Computed properties
const allSelected = computed(() => {
  if (!props.items?.length || !props.selected?.length) return false
  return props.items.length === props.selected.length
})

const someSelected = computed(() => {
  return props.selected && props.selected.length > 0
})

const hasActiveFilters = computed(() => {
  return Object.keys(props.filters).length > 0
})

// Methods
const isSorted = (column: TableColumn) => {
  const sorted = props.sort && props.sort.field === column.key
  if (sorted) {
    console.log(`Column ${column.key} is sorted ${props.sort?.direction}`)
  }
  return sorted
}

const isSortedAsc = (column: TableColumn) => {
  return isSorted(column) && props.sort?.direction === 'asc'
}

const isSortedDesc = (column: TableColumn) => {
  return isSorted(column) && props.sort?.direction === 'desc'
}

const isFiltered = (column: TableColumn) => {
  return props.filters && column.key in props.filters
}

const getColumnStyle = (column: TableColumn) => {
  const style: Record<string, string> = {}

  if (column.width) {
    style.width = column.width
  }

  return style
}

const getColumnLabel = (key: string) => {
  const column = props.columns.find(col => col.key === key)
  return column ? column.label : key
}

const getFilterDisplayValue = (key: string, filter: FilterConfig | any) => {
  // Get column definition
  const column = props.columns.find(col => col.key === key)

  if (!column) return String(filter)

  // Handle simple filters
  if (typeof filter !== 'object') {
    return formatFilterValue(filter, column.type)
  }

  // Handle complex filters
  const { operator, value } = filter
  const operatorDisplay = getOperatorDisplay(operator)
  const formattedValue = formatFilterValue(value, column.type)

  return `${operatorDisplay} ${formattedValue}`
}

const getOperatorDisplay = (operator: string) => {
  const operatorMap: Record<string, string> = {
    '=': 'equals',
    '!=': 'not equals',
    '>': 'greater than',
    '>=': 'greater than or equals',
    '<': 'less than',
    '<=': 'less than or equals',
    'contains': 'contains',
    'startsWith': 'starts with',
    'endsWith': 'ends with'
  }

  return operatorMap[operator] || operator
}

const formatFilterValue = (value: any, type?: string) => {
  if (value === null || value === undefined) return ''

  if (type === 'date' && typeof value === 'string') {
    try {
      // Parse the date using date-fns
      let date: Date | null = null;

      if (value.includes('/')) {
        // Try DD/MM/YYYY format
        date = parse(value, 'dd/MM/yyyy', new Date());
        if (!isValid(date)) {
          // Try MM/DD/YYYY format as fallback
          date = parse(value, 'MM/dd/yyyy', new Date());
        }
      } else {
        // Try ISO format (YYYY-MM-DD)
        date = parseISO(value);
      }

      // Check if date is valid
      if (!date || !isValid(date)) {
        console.warn('Invalid date for formatting in filter display:', value);
        return value;
      }

      // Format as DD/MM/YYYY with leading zeros
      const formatted = format(date, 'dd/MM/yyyy');
      console.log('Formatted date for filter display:', { original: value, formatted });
      return formatted;
    } catch (e) {
      console.error('Error formatting date for filter display:', e);
      return value;
    }
  }

  if (type === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  return String(value)
}

const handleSort = (column: TableColumn) => {
  if (column.sortable) {
    console.log('Header sort clicked:', column.key)
    emit('sort', column)
  }
}

const handleFilterUpdate = (key: string, filter: FilterConfig | null) => {
  console.log('Filter update:', key, filter)

  // Create a new filters object to maintain reactivity
  const newFilters = { ...props.filters }

  if (filter === null) {
    // Remove filter
    delete newFilters[key]
  } else {
    // Add or update filter
    newFilters[key] = filter
  }

  // Emit the updated filters
  emit('update:filters', newFilters)
}

const clearAllFilters = () => {
  // Emit empty filters object
  emit('update:filters', {})
}

const toggleSelectAll = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('select-all', target.checked)
}
</script>

<style>
.arpix-data-table-header-row {
  background-color: var(--arpix-header-background);
  color: var(--arpix-header-text-color);
}

.arpix-data-table-header-cell {
  padding: 0.75rem 1rem;
  font-weight: 600;
  text-align: left;
  border-bottom: 2px solid var(--arpix-border-color);
  white-space: nowrap;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
}

.arpix-data-table-header-content {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
}

.arpix-data-table-header-title {
  display: flex;
  align-items: center;
  overflow: hidden;
}

.arpix-data-table-header-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arpix-data-table-header-actions {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.arpix-data-table-sortable {
  cursor: pointer;
  user-select: none;
}

.arpix-data-table-sortable:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.arpix-data-table-sort-icon {
  display: inline-flex;
  align-items: center;
  margin-left: 0.5rem;
}

.arpix-data-table-selection-cell {
  width: 40px;
  text-align: center;
}

.arpix-data-table-select-all {
  cursor: pointer;
}

.arpix-data-table-filtered {
  position: relative;
}

.arpix-data-table-filtered::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--arpix-primary-color);
}

/* Active filters row */
.arpix-data-table-filters-row {
  background-color: var(--arpix-background-color);
}

.arpix-data-table-filters-cell {
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--arpix-border-color);
}

.arpix-data-table-active-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.arpix-data-table-filters-label {
  font-weight: 500;
  color: var(--arpix-secondary-color);
  margin-right: 0.5rem;
}

.arpix-data-table-filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.arpix-data-table-filter-tag {
  display: flex;
  align-items: center;
  background-color: var(--arpix-header-background);
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.arpix-data-table-filter-tag-label {
  margin-right: 0.5rem;
}

.arpix-data-table-filter-tag-value {
  font-weight: 600;
}

.arpix-data-table-filter-tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: var(--arpix-secondary-color);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
}

.arpix-data-table-filter-tag-remove:hover {
  color: var(--arpix-primary-color);
}

.arpix-data-table-clear-filters {
  background-color: transparent;
  border: none;
  color: var(--arpix-primary-color);
  cursor: pointer;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.arpix-data-table-clear-filters:hover {
  background-color: rgba(0, 0, 0, 0.05);
  text-decoration: underline;
}

/* Dark theme adjustments */
.theme-dark .arpix-data-table-sortable:hover,
.theme-dark .arpix-data-table-clear-filters:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
