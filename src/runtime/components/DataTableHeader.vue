<template>
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
        { 'arpix-data-table-sorted': isSorted(column) }
      ]"
      :style="getColumnStyle(column)"
      @click="handleSort(column)"
    >
      <div class="arpix-data-table-header-content">
        <span>{{ column.label }}</span>

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
    </th>
  </tr>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { TableColumn, SortConfig } from '../types'

// Define props
const props = defineProps<{
  columns: TableColumn[]
  sort: SortConfig | null
  selectable?: boolean
  selected?: any[]
  items?: any[]
}>()

// Define emits
const emit = defineEmits<{
  'sort': [column: TableColumn]
  'select-all': [selected: boolean]
}>()

// Computed properties
const allSelected = computed(() => {
  if (!props.items?.length || !props.selected?.length) return false
  return props.items.length === props.selected.length
})

const someSelected = computed(() => {
  return props.selected && props.selected.length > 0
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

const getColumnStyle = (column: TableColumn) => {
  const style: Record<string, string> = {}

  if (column.width) {
    style.width = column.width
  }

  return style
}

const handleSort = (column: TableColumn) => {
  if (column.sortable) {
    console.log('Header sort clicked:', column.key)
    emit('sort', column)
  }
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
}

.arpix-data-table-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
</style>
