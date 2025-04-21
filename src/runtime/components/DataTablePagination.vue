<template>
  <div class="arpix-data-table-pagination">
    <!-- Page Info -->
    <div class="arpix-data-table-pagination-info">
      <span v-if="pagination.total">
        {{ startItem }}-{{ endItem }} of {{ pagination.total }}
      </span>
    </div>
    
    <!-- Page Size Selector -->
    <div class="arpix-data-table-pagination-size" v-if="showPageSizeSelector">
      <select v-model="pageSize" class="arpix-data-table-pagination-size-select">
        <option v-for="size in pageSizeOptions" :key="size" :value="size">
          {{ size }} per page
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
        aria-label="Go to first page"
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
        aria-label="Go to previous page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>
      
      <!-- Page Numbers -->
      <div class="arpix-data-table-pagination-pages">
        <button 
          v-for="page in visiblePages" 
          :key="page"
          class="arpix-data-table-pagination-page"
          :class="{ 'arpix-data-table-pagination-page-active': page === pagination.page }"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
      </div>
      
      <!-- Next Page -->
      <button 
        class="arpix-data-table-pagination-button"
        :disabled="isLastPage"
        @click="goToNextPage"
        aria-label="Go to next page"
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
        aria-label="Go to last page"
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

// Reactive state
const pageSize = ref(props.pagination.perPage)

// Computed properties
const totalPages = computed(() => {
  if (!props.pagination.total) return 1
  return Math.ceil(props.pagination.total / props.pagination.perPage)
})

const isFirstPage = computed(() => props.pagination.page <= 1)
const isLastPage = computed(() => props.pagination.page >= totalPages.value)

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
  const delta = 2
  const range = []
  
  // Always show first page
  range.push(1)
  
  // Calculate start and end of range
  const rangeStart = Math.max(2, current - delta)
  const rangeEnd = Math.min(total - 1, current + delta)
  
  // Add ellipsis if needed
  if (rangeStart > 2) {
    range.push(-1) // Represents ellipsis
  }
  
  // Add range pages
  for (let i = rangeStart; i <= rangeEnd; i++) {
    range.push(i)
  }
  
  // Add ellipsis if needed
  if (rangeEnd < total - 1) {
    range.push(-2) // Represents ellipsis
  }
  
  // Always show last page if not the first page
  if (total > 1) {
    range.push(total)
  }
  
  return range
})

// Methods
const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value || page === props.pagination.page) return
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
</style>
