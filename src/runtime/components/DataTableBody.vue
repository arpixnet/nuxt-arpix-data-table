<template>
  <tr
    v-for="(item, rowIndex) in items"
    :key="getRowKey(item, rowIndex)"
    class="arpix-data-table-row"
    :class="{ 'arpix-data-table-row-selected': isSelected(item) }"
    @click="handleRowClick(item, rowIndex)"
  >
    <!-- Debug info -->
    <!-- {{ item }} -->
    <!-- Selection Checkbox Column -->
    <td v-if="selectable" class="arpix-data-table-cell arpix-data-table-selection-cell" @click.stop>
      <input
        type="checkbox"
        :checked="isSelected(item)"
        @change="toggleSelect(item)"
        class="arpix-data-table-select"
      />
    </td>

    <!-- Regular Columns -->
    <td
      v-for="column in columns"
      :key="column.key"
      class="arpix-data-table-cell"
      :class="[column.class]"
      @click.stop="handleCellClick(getCellValue(item, column), column.key, item)"
    >
      <slot :name="`cell(${column.key})`" :value="getCellValue(item, column)" :row="item" :column="column">
        <component
          v-if="column.renderer"
          :is="column.renderer"
          :value="getCellValue(item, column)"
          :row="item"
          :column="column"
        />
        <span v-else v-html="formatCellValue(item, column)"></span>
      </slot>
    </td>
  </tr>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import type { TableColumn } from '../types'
import { format, parseISO, parse, isValid } from 'date-fns'

// Define props
const props = defineProps<{
  items: any[]
  columns: TableColumn[]
  selectable?: boolean
  selected?: any[]
  rowKey?: string
}>()

// Define emits
const emit = defineEmits<{
  'select': [selected: any[]]
  'row-click': [row: any, index: number]
  'cell-click': [value: any, key: string, row: any]
}>()

// Computed properties
const selectedItems = computed(() => props.selected || [])

// Methods
const getRowKey = (item: any, index: number) => {
  if (props.rowKey && item[props.rowKey]) {
    return item[props.rowKey]
  }
  return index
}

const isSelected = (item: any) => {
  if (!props.selected) return false

  if (props.rowKey && item[props.rowKey]) {
    return props.selected.some(selected => selected[props.rowKey] === item[props.rowKey])
  }

  return props.selected.includes(item)
}

const toggleSelect = (item: any) => {
  const newSelected = [...selectedItems.value]

  if (isSelected(item)) {
    // Remove from selection
    if (props.rowKey && item[props.rowKey]) {
      const index = newSelected.findIndex(selected => selected[props.rowKey] === item[props.rowKey])
      if (index !== -1) {
        newSelected.splice(index, 1)
      }
    } else {
      const index = newSelected.indexOf(item)
      if (index !== -1) {
        newSelected.splice(index, 1)
      }
    }
  } else {
    // Add to selection
    newSelected.push(item)
  }

  emit('select', newSelected)
}

const getCellValue = (item: any, column: TableColumn) => {
  if (column.relation) {
    // Handle relation
    const { foreignKey, table, displayField } = column.relation

    // Check if the relation is already loaded
    if (item[table]) {
      return item[table][displayField]
    }

    // Return the foreign key as fallback
    return item[foreignKey]
  }

  return item[column.key]
}

const formatCellValue = (item: any, column: TableColumn) => {
  const value = getCellValue(item, column)

  // Use custom formatter if provided
  if (column.format) {
    try {
      // Check if format is a function
      if (typeof column.format === 'function') {
        return column.format(value, item)
      }

      // Handle predefined format strings
      if (typeof column.format === 'string') {
        switch (column.format) {
          case 'date-format':
            try {
              // Parse the date using date-fns
              let date: Date | null = null;

              if (typeof value === 'string') {
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
              } else if (value instanceof Date) {
                date = value;
              }

              // Check if date is valid
              if (!date || !isValid(date)) {
                console.warn('Invalid date for formatting:', value);
                return value;
              }

              // Format as DD/MM/YYYY with leading zeros
              return format(date, 'dd/MM/yyyy');
            } catch (e) {
              console.error('Error formatting date:', e);
              return value;
            }
          case 'currency-format':
            return `$${Number(value).toFixed(2)}`
          case 'status-format':
            const statusClasses: Record<string, string> = {
              completed: 'status-completed',
              pending: 'status-pending',
              cancelled: 'status-cancelled'
            }
            return `<span class="status-badge ${statusClasses[value] || ''}">${value}</span>`
          case 'boolean-format':
            return value
              ? '<span class="status-active">✓</span>'
              : '<span class="status-inactive">✗</span>'
        }
      }
    } catch (error) {
      console.error(`Error formatting column ${column.key}:`, error)
    }
  }

  // Default formatting based on column type
  if (column.type === 'date' && value) {
    try {
      // Parse the date using date-fns
      let date: Date | null = null;

      if (typeof value === 'string') {
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
      } else if (value instanceof Date) {
        date = value;
      }

      // Check if date is valid
      if (!date || !isValid(date)) {
        console.warn(`Invalid date for column ${column.key}:`, value);
        return value;
      }

      // Format as DD/MM/YYYY with leading zeros
      return format(date, 'dd/MM/yyyy');
    } catch (e) {
      console.error(`Error formatting date for column ${column.key}:`, e)
      return value
    }
  }

  if (column.type === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  // Return as is for other types
  return value !== undefined && value !== null ? value : ''
}

const handleRowClick = (item: any, index: number) => {
  emit('row-click', item, index)
}

const handleCellClick = (value: any, key: string, row: any) => {
  emit('cell-click', value, key, row)
}
</script>

<style>
.arpix-data-table-row {
  border-bottom: 1px solid var(--arpix-border-color);
  transition: background-color 0.2s ease;
}

.arpix-data-table-row:hover {
  background-color: var(--arpix-hover-color);
}

.arpix-data-table-row-selected {
  background-color: rgba(59, 130, 246, 0.1);
}

.arpix-data-table-row-selected:hover {
  background-color: rgba(59, 130, 246, 0.15);
}

.arpix-data-table-cell {
  padding: 0.75rem 1rem;
  vertical-align: middle;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arpix-data-table-selection-cell {
  width: 40px;
  text-align: center;
}

.arpix-data-table-select {
  cursor: pointer;
}
</style>
