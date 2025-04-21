<template>
  <div class="arpix-data-table-column-filter">
    <button
      class="arpix-data-table-filter-button"
      @click.stop="toggleFilterMenu($event)"
      :class="{ 'active': isActive }"
      :title="isActive ? 'Filter active' : 'Filter column'"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
      </svg>
    </button>

    <teleport to="body">
      <div v-if="showFilterMenu" class="arpix-data-table-filter-menu">
      <div class="arpix-data-table-filter-header">
        <span>Filter: {{ column.label }}</span>
        <button class="arpix-data-table-filter-close" @click.stop="toggleFilterMenu($event)">×</button>
      </div>

      <div class="arpix-data-table-filter-content">
        <!-- Text/String filter -->
        <div v-if="!column.type || column.type === 'text'" class="arpix-data-table-filter-group">
          <select v-model="filterOperator" class="arpix-data-table-filter-select">
            <option value="contains">Contains</option>
            <option value="=">Equals</option>
            <option value="startsWith">Starts with</option>
            <option value="endsWith">Ends with</option>
          </select>
          <input
            type="text"
            v-model="filterValue"
            class="arpix-data-table-filter-input"
            placeholder="Filter value..."
            @keyup.enter="applyFilter"
          />
        </div>

        <!-- Number filter -->
        <div v-else-if="column.type === 'number'" class="arpix-data-table-filter-group">
          <select v-model="filterOperator" class="arpix-data-table-filter-select">
            <option value="=">Equals</option>
            <option value="!=">Not equals</option>
            <option value=">">Greater than</option>
            <option value=">=">Greater than or equal</option>
            <option value="<">Less than</option>
            <option value="<=">Less than or equal</option>
          </select>
          <input
            type="number"
            v-model="filterValue"
            class="arpix-data-table-filter-input"
            placeholder="Filter value..."
            @keyup.enter="applyFilter"
          />
        </div>

        <!-- Date filter -->
        <div v-else-if="column.type === 'date'" class="arpix-data-table-filter-group">
          <select v-model="filterOperator" class="arpix-data-table-filter-select">
            <option value="=">Equals</option>
            <option value="!=">Not equals</option>
            <option value=">">After</option>
            <option value="<">Before</option>
          </select>
          <input
            type="date"
            v-model="filterValue"
            class="arpix-data-table-filter-input"
            @change="applyFilter"
          />
        </div>

        <!-- Boolean filter -->
        <div v-else-if="column.type === 'boolean'" class="arpix-data-table-filter-group">
          <select
            v-model="filterValue"
            class="arpix-data-table-filter-select"
            @change="applyFilter"
          >
            <option value="">-- Select --</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        <div class="arpix-data-table-filter-actions">
          <button
            class="arpix-data-table-filter-apply"
            @click.stop="applyFilter"
            :disabled="!filterValue"
          >
            Apply
          </button>
          <button
            class="arpix-data-table-filter-clear"
            @click.stop="clearFilter"
            :disabled="!isActive"
          >
            Clear
          </button>
        </div>
      </div>
      </div>
    </teleport>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { TableColumn, FilterConfig } from '../types'

// Define props
const props = defineProps<{
  column: TableColumn
  activeFilters: Record<string, any>
}>()

// Define emits
const emit = defineEmits<{
  'update:filter': [key: string, filter: FilterConfig | null]
}>()

// State
const showFilterMenu = ref(false)
const filterOperator = ref('contains')
const filterValue = ref('')

// Methods
const resetFilterValues = () => {
  // Set default operator based on column type
  if (props.column.type === 'number' || props.column.type === 'date') {
    filterOperator.value = '='
  } else if (props.column.type === 'boolean') {
    filterOperator.value = '='
  } else {
    filterOperator.value = 'contains'
  }

  // Clear filter value
  filterValue.value = ''
}

// Computed
const isActive = computed(() => {
  return props.activeFilters && props.column.key in props.activeFilters
})

// Watch for changes in active filters
watch(() => props.activeFilters, (newFilters) => {
  if (newFilters && props.column.key in newFilters) {
    const filter = newFilters[props.column.key]

    if (typeof filter === 'object') {
      filterOperator.value = filter.operator || 'contains'
      filterValue.value = filter.value || ''
    } else {
      filterOperator.value = '='
      filterValue.value = String(filter)
    }
  } else {
    // Reset if no filter is active
    if (!isActive.value) {
      resetFilterValues()
    }
  }
}, { deep: true, immediate: true })

const toggleFilterMenu = (event: Event) => {
  // Prevent event propagation
  event.stopPropagation()
  event.preventDefault()

  // Toggle filter menu
  showFilterMenu.value = !showFilterMenu.value

  console.log('Toggle filter menu:', showFilterMenu.value)

  // Force a DOM update
  setTimeout(() => {
    console.log('Filter menu state after timeout:', showFilterMenu.value)
  }, 0)
}

const applyFilter = () => {
  if (!filterValue.value) {
    clearFilter()
    return
  }

  let value = filterValue.value

  // Convert value based on column type
  if (props.column.type === 'number') {
    value = Number(value)
  } else if (props.column.type === 'boolean') {
    value = value === 'true'
  }

  // Create filter config
  const filter: FilterConfig = {
    field: props.column.key,
    operator: filterOperator.value as any,
    value
  }

  // Emit filter update
  emit('update:filter', props.column.key, filter)

  // Close filter menu
  showFilterMenu.value = false
}

const clearFilter = () => {
  // Reset filter values
  resetFilterValues()

  // Emit filter clear
  emit('update:filter', props.column.key, null)

  // Close filter menu
  showFilterMenu.value = false
}

// Log filter menu state for debugging
watch(() => showFilterMenu.value, (newValue) => {
  console.log('Filter menu state changed:', newValue)
})
</script>

<style>
.arpix-data-table-column-filter {
  position: relative;
  display: inline-block;
  margin-left: 0.5rem;
  z-index: 1000;
  overflow: visible;
}

.arpix-data-table-filter-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--arpix-secondary-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.arpix-data-table-filter-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--arpix-primary-color);
}

.arpix-data-table-filter-button.active {
  color: var(--arpix-primary-color);
}

.arpix-data-table-filter-menu {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  width: 280px;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: block !important;
  opacity: 1 !important;
  visibility: visible !important;
}

.arpix-data-table-filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--arpix-border-color);
  font-weight: 500;
}

.arpix-data-table-filter-close {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  color: var(--arpix-secondary-color);
}

.arpix-data-table-filter-close:hover {
  color: var(--arpix-primary-color);
}

.arpix-data-table-filter-content {
  padding: 1rem;
}

.arpix-data-table-filter-group {
  margin-bottom: 1rem;
}

.arpix-data-table-filter-select,
.arpix-data-table-filter-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--arpix-border-color);
  border-radius: 4px;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.arpix-data-table-filter-select:focus,
.arpix-data-table-filter-input:focus {
  outline: none;
  border-color: var(--arpix-primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.arpix-data-table-filter-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
}

.arpix-data-table-filter-apply,
.arpix-data-table-filter-clear {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.arpix-data-table-filter-apply {
  background-color: var(--arpix-primary-color);
  color: white;
}

.arpix-data-table-filter-apply:hover:not(:disabled) {
  background-color: var(--arpix-primary-color-dark, #2563eb);
}

.arpix-data-table-filter-clear {
  background-color: transparent;
  color: var(--arpix-secondary-color);
  border: 1px solid var(--arpix-border-color);
}

.arpix-data-table-filter-clear:hover:not(:disabled) {
  background-color: rgba(0, 0, 0, 0.05);
}

.arpix-data-table-filter-apply:disabled,
.arpix-data-table-filter-clear:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Dark theme adjustments */
.theme-dark .arpix-data-table-filter-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.theme-dark .arpix-data-table-filter-clear:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
