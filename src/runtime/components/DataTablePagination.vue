<template>
  <div class="arpix-data-table-pagination">
    <!-- Page Info -->
    <div class="arpix-data-table-pagination-info">
      <span v-if="pagination.total">
        {{ startItem }}-{{ endItem }} {{ t('pagination.of') }} {{ pagination.total }}
      </span>
    </div>

    <!-- Page Size Selector -->
    <div class="arpix-data-table-pagination-size" v-if="showPageSizeSelector">
      <select v-model="pageSize" class="arpix-data-table-pagination-size-select">
        <option v-for="size in pageSizeOptions" :key="size" :value="size">
          {{ t('pagination.itemsPerPage', { count: size }) }}
        </option>
      </select>
    </div>

    <!-- Page Controls -->
    <div class="arpix-data-table-pagination-controls">
      <!-- First Page -->
      <button
        class="arpix-data-table-pagination-button"
        :disabled="isFirstPage"
        @click="goToFirstPage"
        :aria-label="t('pagination.firstPage')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m11 17-5-5 5-5"/>
          <path d="m18 17-5-5 5-5"/>
        </svg>
      </button>

      <!-- Previous Page -->
      <button
        class="arpix-data-table-pagination-button"
        :disabled="isFirstPage"
        @click="goToPreviousPage"
        :aria-label="t('pagination.previousPage')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>

      <!-- Page Numbers -->
      <div class="arpix-data-table-pagination-pages">
        <template v-for="(page, index) in visiblePages" :key="index">
          <!-- Ellipsis -->
          <span
            v-if="page === '...'"
            class="arpix-data-table-pagination-ellipsis"
          >
            &hellip;
          </span>

          <!-- Page number -->
          <button
            v-else
            class="arpix-data-table-pagination-page"
            :class="{ 'arpix-data-table-pagination-page-active': page === pagination.page }"
            @click="goToPage(Number(page))"
          >
            {{ page }}
          </button>
        </template>
      </div>

      <!-- Next Page -->
      <button
        class="arpix-data-table-pagination-button"
        :disabled="isLastPage"
        @click="goToNextPage"
        :aria-label="t('pagination.nextPage')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </button>

      <!-- Last Page -->
      <button
        class="arpix-data-table-pagination-button"
        :disabled="isLastPage"
        @click="goToLastPage"
        :aria-label="t('pagination.lastPage')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m13 17 5-5-5-5"/>
          <path d="m6 17 5-5-5-5"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import type { PaginationConfig } from '../types'
import { useDataTableI18n } from '../composables'

// Define props
const props = defineProps<{
  pagination: PaginationConfig
  showPageSizeSelector?: boolean
  pageSizeOptions?: number[]
}>()

// Define emits
const emit = defineEmits<{
  'page-change': [page: number]
  'page-size-change': [pageSize: number]
}>()

// Use i18n composable
const { t } = useDataTableI18n()

// Reactive state
const pageSize = ref(props.pagination.perPage)

// Computed properties
const totalPages = computed(() => {
  if (!props.pagination.total) return 1
  return Math.ceil(props.pagination.total / props.pagination.perPage)
})

const isFirstPage = computed(() => {
  // Always consider it first page when there's no data
  if (!props.pagination.total) return true
  return props.pagination.page <= 1
})

const isLastPage = computed(() => {
  // Always consider it last page when there's no data
  if (!props.pagination.total) return true
  return props.pagination.page >= totalPages.value
})

const startItem = computed(() => {
  if (!props.pagination.total) return 0
  return (props.pagination.page - 1) * props.pagination.perPage + 1
})

const endItem = computed(() => {
  if (!props.pagination.total) return 0
  return Math.min(props.pagination.page * props.pagination.perPage, props.pagination.total)
})

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = props.pagination.page

  // For small number of pages, show all pages
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  // For larger number of pages, show a limited range with ellipsis
  const result: (number | string)[] = []

  // Always include first page
  result.push(1)

  // Determine the range of pages to show around current page
  let rangeStart = 0, rangeEnd = 0

  if (current <= 3) {
    // If current page is near the beginning
    rangeStart = 2
    rangeEnd = 5
  } else if (current >= total - 2) {
    // If current page is near the end
    rangeStart = total - 4
    rangeEnd = total - 1
  } else {
    // Current page is in the middle
    rangeStart = current - 1
    rangeEnd = current + 1
  }

  // Add ellipsis before range if needed
  if (rangeStart > 2) {
    result.push('...')
  }

  // Add the range of pages
  for (let i = rangeStart; i <= rangeEnd; i++) {
    result.push(i)
  }

  // Add ellipsis after range if needed
  if (rangeEnd < total - 1) {
    result.push('...')
  }

  // Always include last page if not the first page
  if (total > 1) {
    result.push(total)
  }

  return result
})

// Methods
const goToPage = (page: number) => {
  // Don't navigate if there's no data, page is invalid, or it's the current page
  if (!props.pagination.total || page < 1 || page > totalPages.value || page === props.pagination.page) return
  emit('page-change', page)
}

const goToFirstPage = () => {
  goToPage(1)
}

const goToPreviousPage = () => {
  goToPage(props.pagination.page - 1)
}

const goToNextPage = () => {
  goToPage(props.pagination.page + 1)
}

const goToLastPage = () => {
  goToPage(totalPages.value)
}

// Watch for changes
watch(pageSize, (newSize) => {
  emit('page-size-change', newSize)
})
</script>

<style>
.arpix-data-table-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

@media (max-width: 640px) {
  .arpix-data-table-pagination {
    justify-content: center;
    padding: 0 0.5rem;
  }

  .arpix-data-table-pagination-info {
    width: 100%;
    text-align: center;
    margin-bottom: 0.5rem;
  }

  .arpix-data-table-pagination-controls {
    margin: 0 auto;
    padding: 0.5rem 0;
  }

  .arpix-data-table-pagination-button,
  .arpix-data-table-pagination-page,
  .arpix-data-table-pagination-ellipsis {
    margin: 0 0.25rem;
    min-width: 2.25rem;
    height: 2.25rem;
    font-size: 1rem;
  }
}

.arpix-data-table-pagination-info {
  color: var(--arpix-secondary-color);
}

.arpix-data-table-pagination-size-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--arpix-border-color);
  border-radius: 0.375rem;
  background-color: var(--arpix-background-color);
  font-size: 0.875rem;
  outline: none;
}

.arpix-data-table-pagination-controls {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem;
}

.arpix-data-table-pagination-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--arpix-border-color);
  border-radius: 0.375rem;
  background-color: var(--arpix-background-color);
  color: var(--arpix-text-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.arpix-data-table-pagination-button:hover:not(:disabled) {
  background-color: var(--arpix-hover-color);
  border-color: var(--arpix-primary-color);
}

.arpix-data-table-pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.arpix-data-table-pagination-pages {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0 0.5rem;
}

.arpix-data-table-pagination-page {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.5rem;
  border: 1px solid var(--arpix-border-color);
  border-radius: 0.375rem;
  background-color: var(--arpix-background-color);
  color: var(--arpix-text-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.arpix-data-table-pagination-page:hover {
  background-color: var(--arpix-hover-color);
  border-color: var(--arpix-primary-color);
}

.arpix-data-table-pagination-page-active {
  background-color: var(--arpix-primary-color);
  border-color: var(--arpix-primary-color);
  color: white;
}

.arpix-data-table-pagination-page-active:hover {
  background-color: var(--arpix-primary-color);
}

.arpix-data-table-pagination-ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.5rem;
  color: var(--arpix-secondary-color);
}
</style>
