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
      :style="getColumnStyle(column)"
      @click.stop="handleCellClick(getCellValue(item, column), column.key, item)"
    >
      <!-- Mobile Label (only visible in mobile card view) -->
      <div class="arpix-data-table-mobile-label">{{ column.label }}</div>

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
    return props.selected.some(selected => selected[props.rowKey!] === item[props.rowKey!])
  }

  return props.selected.includes(item)
}

const toggleSelect = (item: any) => {
  const newSelected = [...selectedItems.value]

  if (isSelected(item)) {
    // Remove from selection
    if (props.rowKey && item[props.rowKey]) {
      const index = newSelected.findIndex(selected => selected[props.rowKey!] === item[props.rowKey!])
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
            // Generate a class name based on the value
            // eslint-disable-next-line no-case-declarations
            const statusClass = `status-${value.toString().toLowerCase().replace(/\s+/g, '-')}`

            // Check if custom colors are defined for this status value
            // eslint-disable-next-line no-case-declarations
            const hasCustomColors = column.statusColors && column.statusColors[value]

            if (hasCustomColors) {
              // Use custom inline styles if defined
              const customColors = column.statusColors?.[value]
              const customStyle = [
                customColors?.background ? `background-color: ${customColors.background};` : '',
                customColors?.text ? `color: ${customColors.text};` : '',
                customColors?.border ? `border-color: ${customColors.border};` : ''
              ].filter(Boolean).join(' ')

              return `<span class="status-badge" style="${customStyle}">${value}</span>`
            } else {
              // Use predefined classes as fallback
              const isInEnumValues = column.enumValues && column.enumValues.includes(value)
              const predefinedClasses = ['status-completed', 'status-pending', 'status-cancelled', 'status-active', 'status-inactive']
              const useClass = isInEnumValues || predefinedClasses.includes(statusClass) ? statusClass : ''

              return `<span class="status-badge ${useClass}">${value}</span>`
            }
          case 'boolean-format':
            return value
              ? '<span class="boolean-icon boolean-true">✓</span>'
              : '<span class="boolean-icon boolean-false">✗</span>'
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
  position: relative; /* For mobile data labels */
  width: 180px !important; /* Set width for cells without specified width */
  min-width: 180px !important; /* Set minimum width for cells without specified width */
}

/* Override width for cells with explicit width */
.arpix-data-table-cell[style*="width"] {
  width: attr(style width) !important;
  min-width: attr(style width) !important;
}

/* Density styles */
.density-compact .arpix-data-table-cell {
  padding: 0.4rem 0.75rem;
  font-size: 0.9rem;
}

/* Mobile Label (hidden by default) */
.arpix-data-table-mobile-label {
  display: none;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: var(--arpix-secondary-color);
}

/* Mobile and tablet responsive styles */
@media (max-width: 1024px) {
  .arpix-data-table-cell {
    padding: 0.6rem 0.75rem;
    /* Allow text to wrap on mobile */
    white-space: normal;
    word-break: break-word;
    width: 180px !important; /* Maintain consistent width on mobile */
    min-width: 180px !important; /* Maintain consistent minimum width on mobile */
  }

  /* Ensure touch targets are large enough */
  .arpix-data-table-row:active {
    background-color: rgba(0, 0, 0, 0.05);
  }

  /* Override any column alignment in card view */
  .mobile-card-view .arpix-data-table-cell[style*="text-align"] {
    text-align: left !important;
  }

  /* Card view styles */
.mobile-card-view table {
  display: block;
  width: 100% !important;
  min-width: 100% !important;
  max-width: 100% !important;
  table-layout: auto !important;
  box-sizing: border-box;
}

.mobile-card-view thead {
  display: none;
}

.mobile-card-view tbody {
  display: block;
  width: 100%;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

.mobile-card-view .arpix-data-table-row {
  display: block;
  margin-bottom: 1rem;
  border: 1px solid var(--arpix-border-color);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background-color: var(--arpix-background-color);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden; /* Ensure content doesn't overflow */
}

.mobile-card-view .arpix-data-table-cell {
  display: block;
  width: 100% !important;
  min-width: auto !important;
  max-width: 100% !important;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  text-align: left !important; /* Force left alignment in card view */
  white-space: normal;
  box-sizing: border-box;
  word-break: break-word; /* Allow long words to break */
}

.mobile-card-view .arpix-data-table-cell:last-child {
  border-bottom: none;
}

.mobile-card-view .arpix-data-table-mobile-label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--arpix-secondary-color);
  font-size: 0.9rem;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.1);
  padding-bottom: 0.25rem;
  text-align: left !important; /* Force left alignment for mobile labels */
}

.mobile-card-view .arpix-data-table-selection-cell {
  width: 100% !important;
  min-width: 100% !important;
  max-width: 100% !important;
  text-align: left;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.02);
}

.mobile-card-view .arpix-data-table-select {
  margin: 0 0.5rem 0 0;
  width: 24px;
  height: 24px;
}

.mobile-card-view .arpix-data-table-selection-cell::after {
  content: 'Select row';
  font-size: 0.9rem;
  color: var(--arpix-secondary-color);
  margin-left: 0.5rem;
}

.mobile-card-view .arpix-data-table-wrapper {
  overflow: visible;
  margin: 0;
  padding: 0.5rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}
}

.arpix-data-table-selection-cell {
  width: 50px !important;
  min-width: 50px !important;
  max-width: 50px !important;
  text-align: center;
  vertical-align: middle;
}

.arpix-data-table-select {
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
  .arpix-data-table-selection-cell {
    width: 60px !important;
    min-width: 60px !important;
    max-width: 60px !important;
    padding: 0.75rem;
  }

  .arpix-data-table-select {
    width: 24px;
    height: 24px;
  }
}
</style>
