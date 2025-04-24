<template>
  <div class="arpix-data-table-filter-group">
    <div class="arpix-data-table-relation-select-wrapper">
      <select
        v-model="filterValue"
        class="arpix-data-table-filter-select"
        @change="onSelectChange"
      >
        <option value="">{{ t('filters.select') }}</option>
        <option v-for="option in relationOptions" :key="option.id" :value="option.id">
          {{ option.name }}
        </option>
      </select>
      <button
        v-if="relationOptions.length === 0"
        class="arpix-data-table-relation-reload"
        @click="loadRelationOptions()"
        :title="t('filters.reload')"
      >
        ↻
      </button>
    </div>

    <!-- Debug info -->
    <div v-if="showDebugInfo" class="relation-filter-debug">
      <div>Options: {{ relationOptions.length }}</div>
      <div>Column: {{ props.column.key }}</div>
      <div>Table: {{ props.column.relation?.table }}</div>
      <div>Endpoint: {{ apiEndpoint }}</div>
      <button @click="loadRelationOptions()">Reload Options</button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, computed } from 'vue'
import type { TableColumn } from '../types'
import { useRelationLabels } from '../composables/useRelationLabels'
import { useDataTableI18n } from '../composables'

// Define props
const props = defineProps<{
  column: TableColumn
  activeFilter: unknown
  debug?: boolean
  apiEndpoint?: string
}>()

// Use i18n composable
const { t } = useDataTableI18n()

// Debug mode
const showDebugInfo = computed(() => props.debug === true)

// Define emits
const emit = defineEmits<{
  'update:value': [value: string]
}>()

// State
const filterValue = ref('')
const relationOptions = ref<{ id: string | number, name: string }[]>([])

// Determine if we're in the playground environment
const isPlayground = computed(() => {
  return typeof window !== 'undefined' && window.location.pathname.includes('/playground')
})

// Determine the API endpoint to use
const apiEndpoint = computed(() => {
  if (props.apiEndpoint) {
    return props.apiEndpoint
  }

  // Otherwise, use the default endpoint
  // For server-side tables, we need to use the correct endpoint
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const endpoint = isPlayground.value
    ? '/api/playground/relation-options'
    : '/api/arpix-data-table/relation-options'

  // Return the full URL to ensure it works in all environments
  return `${baseUrl}${endpoint}`
})

// Load relation options
const loadRelationOptions = async () => {
  if (!props.column.relation) {
    console.warn('No relation configuration found for column:', props.column.key)
    return
  }

  try {
    const { table, displayField = 'name' } = props.column.relation

    // Build the URL with the computed endpoint
    const url = `${apiEndpoint.value}?table=${table}`

    // Always log this for debugging
    console.log(`Fetching relation options from: ${url}`, {
      column: props.column.key,
      relation: props.column.relation,
      isPlayground: isPlayground.value,
      endpoint: apiEndpoint.value,
    })

    // Use a timeout to ensure the request doesn't hang indefinitely
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Failed to fetch relation options: ${response.status}`)
      }

      const data = await response.json()
      console.log('Relation options API response:', data)

      if (Array.isArray(data)) {
        // Map data to relation options
        relationOptions.value = data.map(item => ({
          id: item.id,
          name: item[displayField] || item.name || item.id,
        }))

        // Store all relation labels for later use
        relationOptions.value.forEach(option => {
          setRelationLabel(props.column.key, option.id, option.name)
        })

        console.log(`Loaded ${relationOptions.value.length} options for ${table} relation:`, relationOptions.value)
      } else {
        console.error('Invalid response format for relation options:', data)
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }
  } catch (error) {
    console.error('Error loading relation options:', error)
    // Fallback to empty options
    relationOptions.value = []

    // If we're in debug mode, add a dummy option to show it's working
    if (props.debug) {
      relationOptions.value = [
        { id: '1', name: 'Debug Option 1' },
        { id: '2', name: 'Debug Option 2' },
      ]
    }
  }
}

// Load options on mount
onMounted(() => {
  loadRelationOptions()

  // Initialize filter value from active filter if present
  if (props.activeFilter) {
    if (typeof props.activeFilter === 'object' && props.activeFilter !== null && 'value' in props.activeFilter) {
      filterValue.value = String(props.activeFilter.value)
    } else {
      filterValue.value = String(props.activeFilter)
    }

    if (props.debug) {
      console.log('Initialized filter value from active filter:', filterValue.value)
    }
  }
})

// Watch for changes in the column or apiEndpoint
watch([() => props.column, apiEndpoint], () => {
  loadRelationOptions()
})

// Watch for changes in activeFilter
watch(() => props.activeFilter, (newFilter) => {
  if (props.debug) {
    console.log('Active filter changed:', newFilter)
  }

  if (newFilter) {
    // Handle different filter formats
    if (typeof newFilter === 'object' && newFilter !== null && 'value' in newFilter) {
      filterValue.value = String(newFilter.value)
    } else {
      filterValue.value = String(newFilter)
    }
  } else {
    filterValue.value = ''
  }
}, { immediate: true })

// Get relation labels store
const { setRelationLabel } = useRelationLabels()

// Handle changes in select dropdown
const onSelectChange = () => {
  if (props.debug) {
    console.log('Relation value changed:', filterValue.value)
  }

  // Find the selected option to get its name
  const selectedOption = relationOptions.value.find(option => String(option.id) === String(filterValue.value))

  if (selectedOption) {
    // Store the relation label for later use
    setRelationLabel(props.column.key, selectedOption.id, selectedOption.name)

    if (props.debug) {
      console.log('Selected relation option:', selectedOption)
    }
  }

  // Only emit the value change, but don't apply the filter yet
  // The parent component will handle applying the filter when the Apply button is clicked
  emit('update:value', filterValue.value)

  // If applyImmediately is true, we would apply the filter immediately
  // But we're changing this behavior to always use the Apply button
}
</script>

<style>
/* Styles are inherited from the parent component */
.arpix-data-table-relation-select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.arpix-data-table-relation-reload {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--arpix-primary-color, #4CAF50);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  margin: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.arpix-data-table-relation-reload:hover {
  color: var(--arpix-primary-hover-color, #45a049);
}

.relation-filter-debug {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 0.25rem;
  font-size: 0.75rem;
}

.relation-filter-debug button {
  margin-top: 0.5rem;
  padding: 0.25rem 0.5rem;
  background-color: #0ea5e9;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
}

.relation-filter-debug button:hover {
  background-color: #0284c7;
}

/* Dark theme adjustments */
.theme-dark .arpix-data-table-relation-reload {
  color: var(--arpix-dark-primary-color, #63b3ed);
}

.theme-dark .arpix-data-table-relation-reload:hover {
  color: var(--arpix-dark-primary-hover-color, #90cdf4);
}
</style>
