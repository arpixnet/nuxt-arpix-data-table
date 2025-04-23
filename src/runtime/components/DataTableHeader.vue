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

        <!-- Sort Indicator (moved outside of header-actions) -->
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
    </th>
  </tr>

  <!-- Active Filters Summary Row (shown only when filters are active) -->
  <tr v-if="hasActiveFilters" class="arpix-data-table-filters-row">
    <th :colspan="selectable ? columns.length + 1 : columns.length" class="arpix-data-table-filters-cell">
      <div class="arpix-data-table-active-filters">
        <span class="arpix-data-table-filters-label">{{ t('filters.title') }}</span>
        <div class="arpix-data-table-filter-tags">
          <div
            v-for="(filter, key) in filters"
            :key="key"
            class="arpix-data-table-filter-tag"
            @click="handleFilterUpdate(String(key), null)"
            :title="t('filters.remove')"
          >
            <span class="arpix-data-table-filter-tag-label">
              {{ getColumnLabel(String(key)) }}:
              <span class="arpix-data-table-filter-tag-value">
                {{ getFilterDisplayValue(String(key), filter) }}
              </span>
            </span>
            <span class="arpix-data-table-filter-tag-remove">
              ×
            </span>
          </div>
        </div>
        <button
          v-if="Object.keys(filters).length > 1"
          class="arpix-data-table-clear-filters"
          @click="clearAllFilters"
        >
          {{ t('filters.clearAll') }}
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
import { useRelationLabels } from '../composables/useRelationLabels'
import { useDataTableI18n } from '../composables'

// Define props
const props = defineProps<{
  columns: TableColumn[]
  sort: SortConfig | null
  filters: FilterSet
  selectable?: boolean
  selected?: any[]
  items?: any[]
  debug?: boolean
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
  if (sorted && props.debug) {
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
    style.minWidth = column.width
  }

  if (column.align) {
    style.textAlign = column.align
  }

  return style
}

const getColumnLabel = (key: string) => {
  const column = props.columns.find(col => col.key === key)
  return column ? column.label : key
}

// Get relation labels
const { getRelationLabel } = useRelationLabels()

// Use i18n composable
const { t } = useDataTableI18n()

const getFilterDisplayValue = (key: string, filter: FilterConfig | any) => {
  // Get column definition
  const column = props.columns.find(col => col.key === key)

  if (!column) return String(filter)

  // Special handling for relation columns
  if (column.type === 'relation' && column.relation) {
    // For relation columns, try to find the display name from the relation options
    let filterValue: string | number = '';

    if (typeof filter !== 'object') {
      filterValue = filter;
    } else if (typeof filter === 'object' && filter !== null && 'value' in filter) {
      filterValue = filter.value;
    }

    // Try to get the label from our store
    const label = getRelationLabel(key, filterValue);

    if (label) {
      // If we have a label, use it
      return label;
    } else {
      // Otherwise, fall back to showing the ID
      return `ID: ${filterValue}`;
    }
  }

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
    '=': t('filters.equals'),
    '!=': t('filters.notEquals'),
    '>': t('filters.greaterThan'),
    '>=': t('filters.greaterThanOrEquals'),
    '<': t('filters.lessThan'),
    '<=': t('filters.lessThanOrEquals'),
    'contains': t('filters.contains'),
    'startsWith': t('filters.startsWith'),
    'endsWith': t('filters.endsWith')
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
        if (props.debug) {
          console.warn('Invalid date for formatting in filter display:', value);
        }
        return value;
      }

      // Format as DD/MM/YYYY with leading zeros
      const formatted = format(date, 'dd/MM/yyyy');
      if (props.debug) {
        console.log('Formatted date for filter display:', { original: value, formatted });
      }
      return formatted;
    } catch (e) {
      if (props.debug) {
        console.error('Error formatting date for filter display:', e);
      }
      return value;
    }
  }

  if (type === 'boolean') {
    return value ? t('boolean.true') : t('boolean.false')
  }

  return String(value)
}

const handleSort = (column: TableColumn) => {
  if (column.sortable) {
    if (props.debug) {
      console.log('Header sort clicked:', column.key)
    }
    emit('sort', column)
  }
}

const handleFilterUpdate = (key: string, filter: FilterConfig | null) => {
  if (props.debug) {
    console.log('Filter update:', key, filter)
  }

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
  padding: 0.75rem 0.5rem; /* Equal padding on both sides */
  font-weight: 600;
  text-align: center; /* Center all headers */
  border-bottom: 2px solid var(--arpix-border-color);
  border-right: 1px solid var(--arpix-border-color); /* Add vertical separator */
  white-space: nowrap;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 180px !important; /* Set width for header cells without specified width */
  min-width: 180px !important; /* Set minimum width for header cells without specified width */
  position: relative; /* For sort icon positioning */
}

/* Override width for header cells with explicit width */
.arpix-data-table-header-cell[style*="width"] {
  width: attr(style width) !important;
  min-width: attr(style width) !important;
}

/* Remove right border from last header cell */
.arpix-data-table-header-cell:last-child {
  border-right: none;
}

/* Density styles */
.density-compact .arpix-data-table-header-cell {
  padding: 0.5rem; /* Equal padding on both sides */
  font-size: 0.9rem;
}

/* Mobile and tablet responsive styles */
@media (max-width: 1024px) {
  .arpix-data-table-header-cell {
    padding: 0.5rem; /* Equal padding on both sides */
    font-size: 0.9rem;
  }

  .arpix-data-table-header-label {
    max-width: 120px; /* Limit width on mobile */
  }

  .arpix-data-table-header-title {
    gap: 0.25rem; /* Adjusted gap on mobile for better touch targets while preventing overlap */
  }

  .arpix-data-table-sort-icon {
    right: 0.25rem; /* Adjust position for smaller screens */
  }
}

.arpix-data-table-header-content {
  display: flex;
  align-items: center;
  justify-content: center; /* Center header content */
  width: 100%;
  position: relative; /* For sort icon positioning */
}

.arpix-data-table-header-title {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  gap: 0.15rem; /* Reduced gap between label and filter button */
}

.arpix-data-table-header-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arpix-data-table-header-actions {
  display: flex;
  align-items: center;
  /* Remove margin-left: auto to allow proper centering */
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
  position: absolute;
  right: 0.25rem;
  /* Position sort icon to the right */
  z-index: 5; /* Ensure it's above other elements */
}

.arpix-data-table-selection-cell {
  width: 50px !important;
  min-width: 50px !important;
  max-width: 50px !important;
  text-align: center;
  padding: 0.75rem 0.5rem;
  vertical-align: middle;
}

.density-compact .arpix-data-table-selection-cell {
  padding: 0.5rem;
}

@media (max-width: 1024px) {
  .arpix-data-table-selection-cell {
    padding: 0.75rem;
    width: 60px !important;
    min-width: 60px !important;
    max-width: 60px !important;
  }
}

.arpix-data-table-select-all {
  cursor: pointer;
  width: 20px;
  height: 20px;
  accent-color: var(--arpix-primary-color);
  margin: 0 auto;
  display: block;
  position: relative;
  border-radius: 4px;
}

@media (max-width: 1024px) {
  .arpix-data-table-select-all {
    width: 24px;
    height: 24px;
  }
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
  text-align: left; /* Ensure left alignment */
}

/* Density styles for filters */
.density-compact .arpix-data-table-filters-cell {
  padding: 0.3rem 0.75rem;
}

/* Mobile and tablet responsive styles for filters */
@media (max-width: 1024px) {
  .arpix-data-table-filters-cell {
    padding: 0.5rem 0.75rem;
  }

  .arpix-data-table-active-filters {
    flex-direction: row; /* Keep horizontal layout */
    align-items: center; /* Center items vertically */
    justify-content: flex-start; /* Left alignment */
    width: 100%;
    flex-wrap: wrap; /* Allow wrapping on small screens */
  }

  .arpix-data-table-filters-label {
    margin-bottom: 0; /* Remove bottom margin */
    margin-right: 0.5rem; /* Add right margin */
    align-self: center; /* Center vertically */
  }

  .arpix-data-table-filter-tags {
    margin-top: 0; /* Remove top margin */
    align-items: center; /* Center vertically */
  }

  .arpix-data-table-filter-tag {
    margin-bottom: 0; /* Remove bottom margin */
  }
}

.arpix-data-table-active-filters {
  display: flex;
  align-items: center; /* Center items vertically */
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.875rem;
  justify-content: flex-start; /* Always align to the left */
  width: 100%; /* Ensure full width */
  margin-bottom: 0; /* Ensure no bottom margin */
}

.arpix-data-table-filters-label {
  font-weight: 500;
  color: var(--arpix-secondary-color);
  margin-right: 0.5rem;
  align-self: center; /* Center vertically */
  display: flex;
  align-items: center;
}

.arpix-data-table-filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center; /* Center vertically */
  justify-content: start;
  margin-bottom: 0; /* Ensure no bottom margin */
}

.arpix-data-table-filter-tag {
  display: flex;
  align-items: center;
  background-color: var(--arpix-header-background);
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
  user-select: none;
  margin-bottom: 0; /* Ensure no bottom margin */
}

.arpix-data-table-filter-tag:hover {
  background-color: var(--arpix-hover-color);
  transform: scale(1.02);
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
  border-radius: 50%;
  color: var(--arpix-secondary-color);
  font-size: 1rem;
  line-height: 1;
  margin-left: 2px;
}

.arpix-data-table-clear-filters {
  background-color: transparent;
  border: none;
  color: var(--arpix-primary-color);
  cursor: pointer;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  align-self: center; /* Center vertically */
  display: flex;
  align-items: center;
  height: 24px; /* Match height with filter tags */
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
