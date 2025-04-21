import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useNuxtApp } from '#app'
import type { 
  TableConfig, 
  TableState, 
  SortConfig, 
  PaginationConfig,
  FilterSet,
  TableColumn
} from '../types'

/**
 * Core composable for managing data table state and operations
 */
export function useDatatable(config: TableConfig) {
  const nuxtApp = useNuxtApp()
  
  // Initialize state
  const state = ref<TableState>({
    items: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      perPage: config.perPage || 10,
      total: 0
    },
    sort: config.initialSort || null,
    filters: config.filters || {},
    searchQuery: '',
    selected: [],
    relationsCache: {}
  })
  
  // Cache for resolved relations
  const relationsCache = reactive<Record<string, any>>({})
  
  /**
   * Load data from the data source
   */
  const loadData = async () => {
    state.value.loading = true
    state.value.error = null
    
    try {
      let data: any[] = []
      
      // Handle different types of data sources
      if (Array.isArray(config.dataSource)) {
        // Array data source
        data = [...config.dataSource]
        
        // Apply client-side pagination, sorting, filtering
        if (config.pagination === 'client') {
          data = processClientData(data)
        }
      } else if (typeof config.dataSource === 'function') {
        // Function data source
        data = await config.dataSource({
          pagination: state.value.pagination,
          sort: state.value.sort,
          filters: state.value.filters,
          search: state.value.searchQuery
        })
      } else if (typeof config.dataSource === 'string') {
        // URL data source (API endpoint)
        data = await fetchFromApi(config.dataSource)
      } else if (typeof config.dataSource === 'object') {
        // Object data source (assuming it has items property)
        data = config.dataSource.items || []
      }
      
      // Update state
      state.value.items = data
      
      // If server pagination, update total
      if (config.pagination === 'server' && typeof data === 'object' && 'total' in data) {
        state.value.pagination.total = data.total
      } else {
        // For client-side pagination, set total to array length
        state.value.pagination.total = data.length
      }
      
      // Load relations if needed
      if (config.relations && config.relations.length > 0) {
        await loadRelations()
      }
    } catch (error: any) {
      state.value.error = error.message || 'Failed to load data'
      console.error('Error loading data:', error)
    } finally {
      state.value.loading = false
    }
  }
  
  /**
   * Process data client-side (sorting, filtering, pagination)
   */
  const processClientData = (data: any[]): any[] => {
    let processed = [...data]
    
    // Apply search
    if (state.value.searchQuery) {
      processed = applySearch(processed, state.value.searchQuery)
    }
    
    // Apply filters
    if (Object.keys(state.value.filters).length > 0) {
      processed = applyFilters(processed, state.value.filters)
    }
    
    // Apply sorting
    if (state.value.sort) {
      processed = applySorting(processed, state.value.sort)
    }
    
    // Calculate total before pagination
    state.value.pagination.total = processed.length
    
    // Apply pagination
    const { page, perPage } = state.value.pagination
    const start = (page - 1) * perPage
    const end = start + perPage
    
    return processed.slice(start, end)
  }
  
  /**
   * Apply search to data
   */
  const applySearch = (data: any[], query: string): any[] => {
    if (!query) return data
    
    const searchableColumns = config.columns.filter(col => col.filterable !== false)
    const lowerQuery = query.toLowerCase()
    
    return data.filter(item => {
      return searchableColumns.some(column => {
        const value = item[column.key]
        if (value === null || value === undefined) return false
        
        return String(value).toLowerCase().includes(lowerQuery)
      })
    })
  }
  
  /**
   * Apply filters to data
   */
  const applyFilters = (data: any[], filters: FilterSet): any[] => {
    return data.filter(item => {
      return Object.entries(filters).every(([key, filter]) => {
        // Skip empty filters
        if (!filter || (typeof filter === 'object' && !filter.value)) return true
        
        // Handle simple filters (key: value)
        if (typeof filter !== 'object') {
          return item[key] === filter
        }
        
        // Handle complex filters
        const { field, operator, value } = filter
        const itemValue = item[field]
        
        switch (operator) {
          case '=':
            return itemValue === value
          case '!=':
            return itemValue !== value
          case '>':
            return itemValue > value
          case '>=':
            return itemValue >= value
          case '<':
            return itemValue < value
          case '<=':
            return itemValue <= value
          case 'contains':
            return String(itemValue).toLowerCase().includes(String(value).toLowerCase())
          case 'startsWith':
            return String(itemValue).toLowerCase().startsWith(String(value).toLowerCase())
          case 'endsWith':
            return String(itemValue).toLowerCase().endsWith(String(value).toLowerCase())
          default:
            return itemValue === value
        }
      })
    })
  }
  
  /**
   * Apply sorting to data
   */
  const applySorting = (data: any[], sort: SortConfig): any[] => {
    const { field, direction } = sort
    const multiplier = direction === 'asc' ? 1 : -1
    
    return [...data].sort((a, b) => {
      const aValue = a[field]
      const bValue = b[field]
      
      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return multiplier
      if (bValue === null || bValue === undefined) return -multiplier
      
      // Compare based on type
      if (typeof aValue === 'string') {
        return multiplier * aValue.localeCompare(bValue)
      }
      
      return multiplier * (aValue - bValue)
    })
  }
  
  /**
   * Fetch data from API
   */
  const fetchFromApi = async (url: string): Promise<any[]> => {
    const { pagination, sort, filters, searchQuery } = state.value
    
    // Build query parameters
    const params = new URLSearchParams()
    
    // Pagination params
    params.append('page', String(pagination.page))
    params.append('perPage', String(pagination.perPage))
    
    // Sort params
    if (sort) {
      params.append('sort', `${sort.field}:${sort.direction}`)
    }
    
    // Filter params
    Object.entries(filters).forEach(([key, value]) => {
      if (typeof value === 'object') {
        params.append(`filter[${key}]`, JSON.stringify(value))
      } else {
        params.append(`filter[${key}]`, String(value))
      }
    })
    
    // Search param
    if (searchQuery) {
      params.append('search', searchQuery)
    }
    
    // Relations
    if (config.relations && config.relations.length > 0) {
      const relationNames = config.relations.map(r => r.name).join(',')
      params.append('with', relationNames)
    }
    
    // Make the request
    const response = await fetch(`${url}?${params.toString()}`)
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }
    
    return await response.json()
  }
  
  /**
   * Load relations data
   */
  const loadRelations = async () => {
    if (!config.relations || !config.relations.length) return
    
    // Get relation columns
    const relationColumns = config.columns.filter(col => col.relation)
    
    // Skip if no relation columns
    if (!relationColumns.length) return
    
    // Process each item
    for (const item of state.value.items) {
      for (const column of relationColumns) {
        if (!column.relation) continue
        
        const { table, foreignKey, displayField } = column.relation
        const foreignKeyValue = item[foreignKey]
        
        // Skip if no foreign key value
        if (foreignKeyValue === null || foreignKeyValue === undefined) continue
        
        // Check cache first
        const cacheKey = `${table}:${foreignKeyValue}`
        
        if (relationsCache[cacheKey]) {
          item[table] = relationsCache[cacheKey]
          continue
        }
        
        // Find relation config
        const relationConfig = config.relations.find(r => r.name === table || r.target === table)
        
        if (!relationConfig) continue
        
        // Load relation data
        try {
          // This is a simplified example - in a real app, you'd fetch from an API
          // or use a more sophisticated data loading mechanism
          const relationData = await fetchRelation(table, foreignKeyValue)
          
          // Cache the result
          relationsCache[cacheKey] = relationData
          
          // Attach to the item
          item[table] = relationData
        } catch (error) {
          console.error(`Error loading relation ${table}:`, error)
        }
      }
    }
  }
  
  /**
   * Fetch relation data
   * This is a placeholder - in a real app, you'd implement this based on your data source
   */
  const fetchRelation = async (table: string, id: any): Promise<any> => {
    // In a real app, you'd fetch from an API or other data source
    // This is just a placeholder implementation
    
    // Example: fetch from API
    try {
      const response = await fetch(`/api/arpix-data-table/relation?table=${table}&id=${id}`)
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error(`Error fetching relation ${table}:${id}:`, error)
      return null
    }
  }
  
  /**
   * Set current page
   */
  const setPage = (page: number) => {
    if (page < 1) page = 1
    
    state.value.pagination.page = page
    
    // Reload data if using server pagination
    if (config.pagination === 'server') {
      loadData()
    }
  }
  
  /**
   * Set page size
   */
  const setPageSize = (size: number) => {
    state.value.pagination.perPage = size
    state.value.pagination.page = 1 // Reset to first page
    
    // Reload data if using server pagination
    if (config.pagination === 'server') {
      loadData()
    }
  }
  
  /**
   * Set sort configuration
   */
  const setSort = (sort: SortConfig) => {
    state.value.sort = sort
    
    // Reload data if using server pagination
    if (config.pagination === 'server') {
      loadData()
    }
  }
  
  /**
   * Set search query
   */
  const setSearch = (query: string) => {
    state.value.searchQuery = query
    state.value.pagination.page = 1 // Reset to first page
    
    // Reload data if using server pagination
    if (config.pagination === 'server') {
      loadData()
    }
  }
  
  /**
   * Set filters
   */
  const setFilters = (filters: FilterSet) => {
    state.value.filters = filters
    state.value.pagination.page = 1 // Reset to first page
    
    // Reload data if using server pagination
    if (config.pagination === 'server') {
      loadData()
    }
  }
  
  /**
   * Set selected rows
   */
  const setSelected = (selected: any[]) => {
    state.value.selected = selected
  }
  
  /**
   * Get display items (for client-side pagination)
   */
  const getDisplayItems = () => {
    if (config.pagination === 'server') {
      return state.value.items
    }
    
    return processClientData([...state.value.items])
  }
  
  /**
   * Format cell value based on column configuration
   */
  const formatCellValue = (value: any, column: TableColumn, row: any) => {
    // Use custom formatter if provided
    if (column.format && typeof column.format === 'function') {
      return column.format(value, row)
    }
    
    // Default formatting based on column type
    if (column.type === 'date' && value) {
      return new Date(value).toLocaleDateString()
    }
    
    if (column.type === 'boolean') {
      return value ? 'Yes' : 'No'
    }
    
    // Return as is for other types
    return value !== undefined && value !== null ? value : ''
  }
  
  /**
   * Export data to various formats
   */
  const exportData = async (format: 'csv' | 'excel' | 'pdf', options: any = {}) => {
    // This is a placeholder - in a real app, you'd implement export functionality
    console.log(`Exporting data to ${format}`, options)
    
    // Example implementation for CSV export
    if (format === 'csv') {
      const columns = options.columns || config.columns
      const items = options.items || state.value.items
      
      // Generate CSV header
      const header = columns.map(col => col.label).join(',')
      
      // Generate CSV rows
      const rows = items.map(item => {
        return columns.map(col => {
          const value = item[col.key]
          return `"${value !== undefined && value !== null ? value : ''}"`
        }).join(',')
      })
      
      // Combine header and rows
      const csv = [header, ...rows].join('\n')
      
      // Create download link
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = options.fileName || 'export.csv'
      a.click()
      
      // Clean up
      URL.revokeObjectURL(url)
    }
  }
  
  // Watch for config changes
  watch(() => config.perPage, (newPerPage) => {
    if (newPerPage && newPerPage !== state.value.pagination.perPage) {
      setPageSize(newPerPage)
    }
  })
  
  // Initialize
  onMounted(() => {
    // Initial data load is handled by the parent component
  })
  
  return {
    state,
    loadData,
    setPage,
    setPageSize,
    setSort,
    setSearch,
    setFilters,
    setSelected,
    getDisplayItems,
    formatCellValue,
    exportData
  }
}
