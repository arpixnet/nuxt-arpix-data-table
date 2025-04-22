<template>
  <div class="arpix-data-table-column-filter">
    <button
      class="arpix-data-table-filter-button"
      @click.stop="toggleFilterMenu($event)"
      :class="{ 'active': isActive }"
      :title="isActive ? 'Filter active' : 'Filter column'"
      ref="filterButton"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
      </svg>
    </button>

    <teleport to="body">
      <div v-if="showFilterMenu" class="arpix-data-table-filter-menu" :style="menuStyle">
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
            v-model="dateFilterValue"
            class="arpix-data-table-filter-input"
          />
          <div class="arpix-data-table-filter-date-info" v-if="dateFilterValue">
            Selected date: {{ formatDateForDisplay(dateFilterValue) }}
          </div>
        </div>

        <!-- Boolean filter -->
        <div v-else-if="column.type === 'boolean'" class="arpix-data-table-filter-group">
          <div class="arpix-data-table-filter-radio-group">
            <div class="arpix-data-table-filter-radio">
              <input
                type="radio"
                id="filter-boolean-true"
                name="boolean-filter"
                value="true"
                v-model="booleanValue"
              />
              <label for="filter-boolean-true">Yes</label>
            </div>
            <div class="arpix-data-table-filter-radio">
              <input
                type="radio"
                id="filter-boolean-false"
                name="boolean-filter"
                value="false"
                v-model="booleanValue"
              />
              <label for="filter-boolean-false">No</label>
            </div>
          </div>
        </div>

        <!-- Enum/Status filter (auto-detected) -->
        <div v-else-if="column.enumValues || isEnumField" class="arpix-data-table-filter-group">
          <div v-if="enumValues.length <= 3" class="arpix-data-table-filter-checkboxes">
            <div v-for="value in enumValues" :key="value" class="arpix-data-table-filter-checkbox">
              <input
                type="checkbox"
                :id="`filter-${column.key}-${value}`"
                :value="value"
                v-model="selectedEnumValues"
                @change="onEnumValueChange"
              />
              <label :for="`filter-${column.key}-${value}`">{{ value }}</label>
            </div>
          </div>
          <select
            v-else
            v-model="filterValue"
            class="arpix-data-table-filter-select"
            @change="onSelectChange"
          >
            <option value="">-- Select --</option>
            <option v-for="value in enumValues" :key="value" :value="value">{{ value }}</option>
          </select>
        </div>

        <div class="arpix-data-table-filter-actions">
          <button
            class="arpix-data-table-filter-apply"
            @click.stop="applyFilter"
            :disabled="!filterValue && selectedEnumValues.length === 0 && !dateFilterValue && !booleanValue"
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
import { ref, computed, watch, onMounted, onUnmounted, reactive } from 'vue'
import type { TableColumn, FilterConfig } from '../types'
import { format, parse, isValid, parseISO } from 'date-fns'

// Define props
const props = defineProps<{
  column: TableColumn
  activeFilters: Record<string, any>
  debug?: boolean
}>()

// Define emits
const emit = defineEmits<{
  'update:filter': [key: string, filter: FilterConfig | null]
}>()

// State
const showFilterMenu = ref(false)
const filterOperator = ref('contains')
const filterValue = ref('')
const dateFilterValue = ref('')
const booleanValue = ref('')
const selectedEnumValues = ref<string[]>([])

// Enum values detection
const isEnumField = computed(() => {
  // Check if this is a field that should use enum filter (like status)
  const key = props.column.key.toLowerCase()
  return key === 'status' || key.includes('status') || key === 'state' || key === 'type' || key === 'category'
})

// Get possible enum values from active filters or detect from column configuration
const enumValues = computed(() => {
  // If column has predefined enum values, use those
  if (props.column.enumValues && Array.isArray(props.column.enumValues)) {
    return props.column.enumValues
  }

  // Try to detect enum values from the data
  // This would typically be provided by the parent component
  // For now, return some default values for common fields
  if (isEnumField.value) {
    const key = props.column.key.toLowerCase()
    if (key === 'status' || key.includes('status')) {
      // Common status values
      if (key.includes('active')) {
        return ['Active', 'Inactive']
      } else {
        return ['Active', 'Inactive', 'Pending', 'Completed', 'Cancelled']
      }
    } else if (key === 'type') {
      return ['Type A', 'Type B', 'Type C']
    } else if (key === 'category') {
      return ['Category 1', 'Category 2', 'Category 3']
    }
  }

  return []
})

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

  // Clear filter values
  filterValue.value = ''
  dateFilterValue.value = ''
  booleanValue.value = ''

  // Clear enum values
  selectedEnumValues.value = []
}

// Format date for display using date-fns
const formatDateForDisplay = (dateStr: string) => {
  try {
    let date: Date | null = null;

    // Parse the date string based on its format
    if (dateStr.includes('/')) {
      // Try DD/MM/YYYY format
      date = parse(dateStr, 'dd/MM/yyyy', new Date());
      if (!isValid(date)) {
        // Try MM/DD/YYYY format as fallback
        date = parse(dateStr, 'MM/dd/yyyy', new Date());
      }
    } else {
      // Try ISO format (YYYY-MM-DD)
      date = parseISO(dateStr);
    }

    // Check if date is valid
    if (!isValid(date)) {
      console.warn('Invalid date for formatting:', dateStr);
      return dateStr;
    }

    // Format as DD/MM/YYYY with leading zeros
    const formatted = format(date, 'dd/MM/yyyy');
    console.log('Date formatting with date-fns:', {
      original: dateStr,
      parsed: date.toISOString(),
      formatted
    });

    return formatted;
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateStr;
  }
}

// Apply date filter using date-fns
const applyDateFilter = () => {
  if (!dateFilterValue.value) {
    clearFilter()
    return
  }

  // Log the date value we're filtering with
  console.log('Applying date filter with value:', dateFilterValue.value)

  // Parse the date using date-fns
  let dateObj: Date | null = null;

  // Try to parse the date based on its format
  if (dateFilterValue.value.includes('/')) {
    // Try DD/MM/YYYY format first
    dateObj = parse(dateFilterValue.value, 'dd/MM/yyyy', new Date());
    if (!isValid(dateObj)) {
      // Try MM/DD/YYYY format as fallback
      dateObj = parse(dateFilterValue.value, 'MM/dd/yyyy', new Date());
    }
  } else {
    // Try ISO format (YYYY-MM-DD)
    dateObj = parseISO(dateFilterValue.value);
  }

  // Check if date is valid
  if (!isValid(dateObj)) {
    console.error('Invalid date value:', dateFilterValue.value);
    return;
  }

  // Format the date for display
  const formattedDate = format(dateObj, 'dd/MM/yyyy');
  console.log('Formatted date for display:', formattedDate);

  // Format the date as ISO string for filtering (YYYY-MM-DD)
  const isoDate = format(dateObj, 'yyyy-MM-dd');

  // Log date components for debugging
  console.log('Date components with date-fns:', {
    original: dateFilterValue.value,
    parsed: dateObj,
    formatted: formattedDate,
    iso: isoDate
  });

  // Create filter config for date
  const filter: FilterConfig = {
    field: props.column.key,
    operator: filterOperator.value as any,
    value: isoDate // ISO format YYYY-MM-DD
  }

  // Emit filter update
  emit('update:filter', props.column.key, filter)

  // Close filter menu
  showFilterMenu.value = false
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
      // Handle enum/multiple values filter
      if (filter.operator === 'in' && Array.isArray(filter.value)) {
        selectedEnumValues.value = filter.value
      } else {
        // Handle regular filter
        filterOperator.value = filter.operator || 'contains'

        // Handle date filters
        if (props.column.type === 'date' && filter.value) {
          // Store the filter operator
          filterOperator.value = filter.operator || '=';
          console.log('Setting date filter operator:', filterOperator.value);

          // Convert the date value if needed
          if (typeof filter.value === 'string') {
            // If the date is in ISO format (YYYY-MM-DD), use it directly
            if (filter.value.match(/^\d{4}-\d{2}-\d{2}$/)) {
              dateFilterValue.value = filter.value;
            } else {
              // Try to parse and convert to ISO format
              try {
                const date = parseISO(filter.value);
                if (isValid(date)) {
                  dateFilterValue.value = format(date, 'yyyy-MM-dd');
                } else {
                  dateFilterValue.value = '';
                }
              } catch (e) {
                console.error('Error parsing date from filter:', e);
                dateFilterValue.value = '';
              }
            }
          } else {
            dateFilterValue.value = '';
          }

          console.log('Setting date filter value:', {
            original: filter.value,
            converted: dateFilterValue.value,
            operator: filterOperator.value
          });
        }
        // Handle boolean filters
        else if (props.column.type === 'boolean' && filter.value !== undefined) {
          booleanValue.value = filter.value === true ? 'true' : 'false'
          console.log('Setting boolean value from filter:', booleanValue.value)
        }
        // Handle other filters
        else {
          filterValue.value = filter.value || ''
        }
      }
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

// Global registry for open filter menus
const openFilterMenus = new Set<string>();

// Generate a unique ID for this filter instance
const filterId = `filter-${Math.random().toString(36).substring(2, 11)}`;

// Reference to the filter button element
const filterButton = ref<HTMLElement | null>(null);

// Menu position and style
const menuStyle = reactive({
  position: 'fixed',
  top: '0px',
  left: '0px',
  zIndex: '9999'
});

// Close all other filter menus
const closeOtherFilterMenus = () => {
  // Create a custom event to notify other filters to close
  const event = new CustomEvent('close-filter-menus', {
    detail: { exceptId: filterId }
  });
  document.dispatchEvent(event);
};

// Listen for close events from other filters
onMounted(() => {
  document.addEventListener('close-filter-menus', ((event: CustomEvent) => {
    // Close this filter menu if it's not the one that should stay open
    if (event.detail.exceptId !== filterId) {
      showFilterMenu.value = false;
    }
  }) as EventListener);
});

// Clean up event listener on unmount
onUnmounted(() => {
  document.removeEventListener('close-filter-menus', (() => {}) as EventListener);
});

// Toggle filter menu
const toggleFilterMenu = (event: Event) => {
  // Prevent event propagation
  event.stopPropagation();
  event.preventDefault();

  // If this filter is already open, close it
  if (showFilterMenu.value) {
    showFilterMenu.value = false;
    return;
  }

  // Close all other filter menus
  closeOtherFilterMenus();

  // Open this filter menu
  showFilterMenu.value = true;

  // Position the menu after DOM update
  setTimeout(() => {
    updateMenuPosition();
  }, 10);
};

// Update menu position based on button position
const updateMenuPosition = () => {
  if (!filterButton.value) return;

  const buttonRect = filterButton.value.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Default position is below the button
  let top = buttonRect.bottom + 5;
  let left = buttonRect.left;

  // Check if menu would go off the right edge of the screen
  if (left + 280 > viewportWidth - 20) {
    left = Math.max(20, viewportWidth - 280 - 20);
  }

  // Check if menu would go off the bottom of the screen
  // We'll estimate the menu height as 300px if we can't measure it yet
  if (top + 300 > viewportHeight - 20) {
    // Position above the button instead
    top = Math.max(20, buttonRect.top - 300 - 5);
  }

  // Update menu style
  menuStyle.top = `${top}px`;
  menuStyle.left = `${left}px`;
};

const applyFilter = () => {
  // For date fields, use the dateFilterValue
  if (props.column.type === 'date' && dateFilterValue.value) {
    // Apply date filter using date-fns
    applyDateFilter();
    return;
  }

  // For boolean fields, use the booleanValue
  if (props.column.type === 'boolean' && booleanValue.value !== '') {
    // Convert string value to boolean - VERY IMPORTANT: this must be a real boolean, not a string
    // Use explicit true/false values to ensure correct comparison
    const boolValue = booleanValue.value === 'true' ? true : false

    console.log('Boolean filter raw value:', booleanValue.value)
    console.log('Boolean filter converted value:', boolValue)
    console.log('Boolean filter type:', typeof boolValue)
    console.log('Boolean filter is true?', boolValue === true)
    console.log('Boolean filter is false?', boolValue === false)

    // Create filter config with explicit boolean value
    const filter: FilterConfig = {
      field: props.column.key,
      operator: '=',
      value: boolValue
    }

    console.log('Applying boolean filter:', {
      field: props.column.key,
      value: boolValue,
      valueType: typeof boolValue,
      valueIsTrue: boolValue === true,
      valueIsFalse: boolValue === false,
      rawValue: booleanValue.value,
      booleanValueType: typeof booleanValue.value
    })

    // Emit filter update
    emit('update:filter', props.column.key, filter)

    // Close filter menu
    showFilterMenu.value = false
    return
  }

  // For enum fields with checkboxes, use the selectedEnumValues
  if ((props.column.enumValues || isEnumField.value)) {
    if (selectedEnumValues.value.length > 0) {
      // Create filter config for enum values with checkboxes (multiple selection)
      const filter: FilterConfig = {
        field: props.column.key,
        operator: 'in', // New operator for multiple values
        value: selectedEnumValues.value
      }

      // Emit filter update
      emit('update:filter', props.column.key, filter)

      // Close filter menu
      showFilterMenu.value = false
      return
    } else if (filterValue.value) {
      // Create filter config for enum values with select (single selection)
      const filter: FilterConfig = {
        field: props.column.key,
        operator: '=', // Equals operator for single value
        value: filterValue.value
      }

      // Emit filter update
      emit('update:filter', props.column.key, filter)

      // Close filter menu
      showFilterMenu.value = false
      return
    }
  }

  // For other fields, use the filterValue
  if (!filterValue.value) {
    clearFilter()
    return
  }

  let value: any = filterValue.value

  // Convert value based on column type
  if (props.column.type === 'number') {
    value = Number(value)
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

// Handle changes in enum checkbox values
const onEnumValueChange = () => {
  console.log('Enum values changed:', selectedEnumValues.value)
  // We don't apply the filter immediately, user needs to click Apply
}

// Handle changes in select dropdown
const onSelectChange = () => {
  if (props.debug) {
    console.log('Select value changed:', filterValue.value)
  }
  // We don't apply the filter immediately, user needs to click Apply
}



// Watch filter menu state changes
watch(() => showFilterMenu.value, (newValue) => {
  if (props.debug) {
    console.log(`Filter ${filterId} menu state changed:`, newValue)
  }

  // Add or remove click outside handler
  if (newValue) {
    // Add click outside handler after a short delay to prevent immediate closing
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
      // Update position in case of window resize
      window.addEventListener('resize', updateMenuPosition)
    }, 100)
  } else {
    document.removeEventListener('click', handleClickOutside)
    window.removeEventListener('resize', updateMenuPosition)
  }
})

// Close filter menu when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement

  // Check if click is inside this filter's button or menu
  const isClickInsideButton = filterButton.value?.contains(target);
  const isClickInsideMenu = target.closest('.arpix-data-table-filter-menu');

  if (!isClickInsideButton && !isClickInsideMenu) {
    if (props.debug) {
      console.log('Click outside, closing filter menu');
    }
    showFilterMenu.value = false;
  }
}
</script>

<style>
.arpix-data-table-column-filter {
  position: relative;
  display: inline-block;
  margin-left: 0.15rem; /* Reduced margin as requested */
  margin-right: 1rem; /* Add right margin to avoid overlap with sort icon */
  z-index: 10;
}

.arpix-data-table-filter-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px; /* Increased width for better touch target */
  height: 28px; /* Increased height for better touch target */
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--arpix-secondary-color);
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 4px; /* Add padding for better touch area */
}

.arpix-data-table-filter-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--arpix-primary-color);
}

.arpix-data-table-filter-button.active {
  color: var(--arpix-primary-color);
}

.arpix-data-table-filter-menu {
  width: 280px;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 400px;
  overflow-y: auto;
  z-index: 100; /* Ensure it appears above other elements */
}

/* Mobile responsive styles for filter menu */
@media (max-width: 640px) {
  .arpix-data-table-filter-menu {
    width: 100%;
    max-width: 320px;
    position: fixed !important;
    left: 50% !important;
    top: 50% !important;
    transform: translate(-50%, -50%) !important;
    max-height: 80vh;
    border-radius: 8px;
  }

  /* Add overlay background */
  .arpix-data-table-filter-menu::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: -1;
  }
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

/* Mobile responsive styles for filter controls */
@media (max-width: 640px) {
  .arpix-data-table-column-filter {
    margin-left: 0.75rem; /* Even more margin on mobile */
  }

  .arpix-data-table-filter-button {
    width: 32px; /* Larger button on mobile */
    height: 32px; /* Larger button on mobile */
    padding: 6px; /* More padding for better touch area */
  }

  .arpix-data-table-filter-content {
    padding: 0.75rem;
  }

  .arpix-data-table-filter-select,
  .arpix-data-table-filter-input {
    padding: 0.6rem;
    font-size: 1rem; /* Larger font for better touch targets */
  }

  .arpix-data-table-filter-apply,
  .arpix-data-table-filter-clear {
    padding: 0.6rem 1rem;
    font-size: 1rem;
    min-width: 80px; /* Ensure buttons are large enough to tap */
  }

  .arpix-data-table-filter-checkbox label,
  .arpix-data-table-filter-radio label {
    font-size: 1rem;
    padding: 0.25rem 0;
  }

  /* Increase spacing for better touch targets */
  .arpix-data-table-filter-checkboxes,
  .arpix-data-table-filter-radio-group {
    gap: 0.75rem;
  }
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

/* Checkbox styles for enum filters */
.arpix-data-table-filter-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.arpix-data-table-filter-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.arpix-data-table-filter-checkbox input[type="checkbox"] {
  margin: 0;
}

.arpix-data-table-filter-checkbox label {
  cursor: pointer;
  font-size: 0.875rem;
}

/* Radio button styles for boolean filters */
.arpix-data-table-filter-radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.arpix-data-table-filter-radio {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.arpix-data-table-filter-radio input[type="radio"] {
  margin: 0;
}

.arpix-data-table-filter-radio label {
  cursor: pointer;
  font-size: 0.875rem;
}

/* Date filter styles */
.arpix-data-table-filter-date-info {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #666;
}

/* Boolean filter actions */
.boolean-filter-actions {
  margin-top: 0.5rem;
  display: flex;
  justify-content: flex-end;
}

.boolean-filter-actions .arpix-data-table-filter-clear {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

/* Dark theme adjustments */
.theme-dark .arpix-data-table-filter-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.theme-dark .arpix-data-table-filter-clear:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
