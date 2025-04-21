import { ref, reactive, watch, onMounted } from 'vue'
import type {
  TableConfig,
  TableState,
  SortConfig,
  FilterSet,
  TableColumn
} from '../types'

/**
 * Core composable for managing data table state and operations
 */
export function useDatatable(config: TableConfig) {

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
      console.log('Loading data from source:', config.dataSource)

      // Direct assignment for array data sources to ensure data is loaded
      if (Array.isArray(config.dataSource)) {
        state.value.items = [...config.dataSource]
      }

      // Handle different types of data sources
      if (Array.isArray(config.dataSource)) {
        // Array data source
        data = [...config.dataSource]
        console.log('Array data source, items:', data.length)

        // Apply client-side pagination, sorting, filtering
        if (config.pagination === 'client') {
          data = processClientData(data)
        }
      } else if (typeof config.dataSource === 'function') {
        // Function data source (client-side only)
        try {
          // @ts-ignore - We know this is a function, but TypeScript doesn't because we removed it from the type definition
          data = await config.dataSource({
            pagination: state.value.pagination,
            sort: state.value.sort,
            filters: state.value.filters,
            search: state.value.searchQuery
          })
        } catch (error) {
          console.error('Error calling function data source:', error)
          data = []
        }
      } else if (typeof config.dataSource === 'string') {
        // URL data source (API endpoint)
        const apiResponse = await fetchFromApi(config.dataSource)
        console.log('API response in loadData:', apiResponse)

        // Handle different API response formats
        if (apiResponse && typeof apiResponse === 'object') {
          if (Array.isArray(apiResponse)) {
            // Response is an array
            data = apiResponse
          } else if (apiResponse.items && Array.isArray(apiResponse.items)) {
            // Response has items property which is an array
            data = apiResponse.items

            // Update pagination if available
            if (apiResponse.pagination && typeof apiResponse.pagination === 'object') {
              if (apiResponse.pagination.total !== undefined) {
                state.value.pagination.total = apiResponse.pagination.total
              }
            }
          } else {
            // Try to extract data from response
            console.warn('Unexpected API response format:', apiResponse)
            data = []
          }
        } else {
          console.warn('Invalid API response:', apiResponse)
          data = []
        }
      } else if (typeof config.dataSource === 'object') {
        // Object data source (assuming it has items property)
        data = (config.dataSource as any).items || []
      }

      // Update state
      state.value.items = data
      console.log('Data loaded, items:', state.value.items)

      // If server pagination not already handled, update total
      if (config.pagination !== 'server' || state.value.pagination.total === 0) {
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
    console.log('Processing client data, items:', data.length)
    let processed = [...data]

    // Apply search
    if (state.value.searchQuery) {
      processed = applySearch(processed, state.value.searchQuery)
      console.log('After search:', processed.length, 'items')
    }

    // Apply filters
    if (Object.keys(state.value.filters).length > 0) {
      console.log('Applying filters in processClientData:', state.value.filters)

      // Debug each filter
      Object.entries(state.value.filters).forEach(([key, filter]) => {
        if (typeof filter === 'object' && filter.value === false) {
          console.log(`Found boolean false filter for ${key}:`, filter);
        }
      });

      processed = applyFilters(processed, state.value.filters)
      console.log('After filters:', processed.length, 'items')
    }

    // Apply sorting
    if (state.value.sort) {
      console.log('Applying sort in processClientData:', state.value.sort)
      processed = applySorting(processed, state.value.sort)
      console.log('After sorting:', processed.length, 'items')
    } else {
      console.log('No sort configuration found')
    }

    // Calculate total before pagination
    state.value.pagination.total = processed.length

    // Return all data for client-side pagination
    // Pagination will be applied in getDisplayItems
    return processed
  }

  /**
   * Apply search to data
   */
  const applySearch = (data: any[], query: string): any[] => {
    if (!query) return data

    console.log('Applying search with query:', query)

    // Check if config.columns is defined
    if (!config.columns || !Array.isArray(config.columns)) {
      console.error('Error: config.columns is undefined or not an array', config)
      return data
    }

    // Get columns that can be searched (not explicitly set to filterable: false)
    const searchableColumns = config.columns.filter(col => col.filterable !== false)
    console.log('Searchable columns:', searchableColumns.map(col => col.key))

    if (searchableColumns.length === 0) {
      console.warn('No searchable columns found. Make sure columns have filterable: true')
      return data
    }

    const lowerQuery = query.toLowerCase().trim()

    if (lowerQuery === '') return data

    const filteredData = data.filter(item => {
      // Skip if item is not an object
      if (!item || typeof item !== 'object') return false

      return searchableColumns.some(column => {
        // Skip if column key is not defined
        if (!column || !column.key) return false

        // Get value from item
        const value = item[column.key]
        if (value === null || value === undefined) return false

        // Convert to string and check if it includes the query
        try {
          const stringValue = String(value).toLowerCase()
          const matches = stringValue.includes(lowerQuery)

          // For debugging
          if (matches) {
            console.log(`Match found in column ${column.key}:`, { value, query: lowerQuery })
          }

          return matches
        } catch (error) {
          console.error(`Error searching in column ${column.key}:`, error)
          return false
        }
      })
    })

    console.log(`Search results: ${filteredData.length} items found out of ${data.length}`)
    return filteredData
  }

  /**
   * Apply filters to data
   */
  const applyFilters = (data: any[], filters: FilterSet): any[] => {
    console.log('Applying filters:', filters)

    if (!filters || Object.keys(filters).length === 0) {
      return data
    }

    const filteredData = data.filter(item => {
      return Object.entries(filters).every(([key, filter]) => {
        // Skip empty filters, but be careful with boolean false values
        if (!filter) {
          console.log(`Skipping null/undefined filter for ${key}:`, filter);
          return true;
        }

        if (typeof filter === 'object') {
          // For boolean filters, we need to check if value is explicitly false
          const isBooleanFilter = filter.value === false;
          const isEmpty = filter.value === undefined || filter.value === null || filter.value === '';

          if (isEmpty && !isBooleanFilter) {
            console.log(`Skipping empty filter for ${key}:`, filter);
            return true;
          }
        }

        // Get column definition to determine type
        const column = config.columns?.find(col => col.key === key);

        // Handle simple filters (key: value)
        if (typeof filter !== 'object') {
          const result = compareValues(item[key], filter, '=', column?.type);
          console.log(`Simple filter for ${key}:`, { itemValue: item[key], filterValue: filter, result });
          return result;
        }

        // Handle complex filters
        const { field, operator, value } = filter;
        const itemValue = item[field || key];

        // Special debug for boolean filters
        if (column?.type === 'boolean' || typeof itemValue === 'boolean') {
          console.log(`Boolean filter check for ${key}:`, {
            itemValue,
            filterValue: value,
            operator,
            itemValueType: typeof itemValue,
            filterValueType: typeof value,
            item
          });
        }

        const result = compareValues(itemValue, value, operator, column?.type);
        console.log(`Complex filter for ${key}:`, { itemValue, filterValue: value, operator, result });
        return result;
      });
    });

    console.log('Filtered data:', filteredData.length, 'items out of', data.length);
    return filteredData;
  }

  /**
   * Compare values based on operator and type
   */
  const compareValues = (itemValue: any, filterValue: any, operator: string, type?: string): boolean => {
    // Handle null/undefined values
    if (itemValue === null || itemValue === undefined) {
      // Special case for boolean filters with false value
      if (type === 'boolean' && filterValue === false && operator === '=') {
        console.log('Special case: comparing null/undefined with false');
        return true; // Consider null/undefined as false for boolean equality
      }
      return operator === '!=' ? filterValue !== null : false
    }

    // Auto-detect type if not specified
    if (!type) {
      if (typeof itemValue === 'number') {
        type = 'number';
      } else if (typeof itemValue === 'boolean') {
        type = 'boolean';
      } else if (itemValue instanceof Date ||
                (typeof itemValue === 'string' && !isNaN(Date.parse(itemValue)))) {
        type = 'date';
      }
    }

    // Special handling for ID fields
    const isIdField = operator === '=' && (filterValue !== undefined) &&
                     (String(itemValue).toLowerCase().includes('id') ||
                      String(filterValue).toLowerCase().includes('id'));

    // Check if both values are numeric strings or numbers
    const bothNumeric = !isNaN(Number(itemValue)) && !isNaN(Number(filterValue));

    // For ID fields, we need to be more careful with type conversion
    if (isIdField) {
      // If both are numeric, compare as numbers
      if (bothNumeric) {
        return Number(itemValue) === Number(filterValue);
      }
      // Otherwise compare as strings
      return String(itemValue) === String(filterValue);
    }

    // Convert values based on type for non-ID fields
    if (type === 'number' || (!type && bothNumeric && typeof itemValue !== 'string')) {
      itemValue = Number(itemValue)
      filterValue = Number(filterValue)
    } else if (type === 'date') {
      try {
        // Normalize date strings to YYYY-MM-DD format
        if (typeof itemValue === 'string') {
          // Remove any time component and ensure YYYY-MM-DD format
          itemValue = itemValue.split('T')[0].split(' ')[0]
        }

        if (!(itemValue instanceof Date)) {
          itemValue = new Date(itemValue)
        }

        if (typeof filterValue === 'string') {
          // Remove any time component and ensure YYYY-MM-DD format
          filterValue = filterValue.split('T')[0].split(' ')[0]
        }

        if (!(filterValue instanceof Date)) {
          filterValue = new Date(filterValue)
        }

        // Reset time components to compare dates only
        itemValue.setHours(0, 0, 0, 0)
        filterValue.setHours(0, 0, 0, 0)

        console.log('Comparing dates:', {
          itemValue,
          filterValue,
          itemValueStr: itemValue.toISOString(),
          filterValueStr: filterValue.toISOString()
        })
      } catch (e) {
        console.error('Error converting date values:', e)
        return false
      }
    } else if (type === 'boolean') {
      // Convert itemValue to boolean - VERY IMPORTANT: use actual boolean values
      let itemBoolValue: boolean;
      if (typeof itemValue === 'boolean') {
        // Already a boolean, use as is
        itemBoolValue = itemValue;
      } else if (typeof itemValue === 'string') {
        // Convert string to boolean
        const itemStr = String(itemValue).toLowerCase();
        // Explicitly set to true or false
        itemBoolValue = itemStr === 'true' || itemStr === 'yes' || itemStr === '1' || itemStr === 'y';
      } else if (typeof itemValue === 'number') {
        // Convert number to boolean
        itemBoolValue = itemValue === 1;
      } else {
        // Default to false for null, undefined, or other types
        itemBoolValue = false;
      }

      // Convert filterValue to boolean - VERY IMPORTANT: use actual boolean values
      let filterBoolValue: boolean;
      if (typeof filterValue === 'boolean') {
        // Already a boolean, use as is
        filterBoolValue = filterValue;
      } else if (typeof filterValue === 'string') {
        // Convert string to boolean
        const filterStr = String(filterValue).toLowerCase();
        // Explicitly set to true or false
        filterBoolValue = filterStr === 'true' || filterStr === 'yes' || filterStr === '1' || filterStr === 'y';
      } else if (typeof filterValue === 'number') {
        // Convert number to boolean
        filterBoolValue = filterValue === 1;
      } else {
        // Default to false for null, undefined, or other types
        filterBoolValue = false;
      }

      console.log('Client comparing boolean values:', {
        itemValue,
        itemBoolValue,
        filterValue,
        filterBoolValue,
        operator,
        result: itemBoolValue === filterBoolValue,
        strictEqual: Object.is(itemBoolValue, filterBoolValue),
        itemValueType: typeof itemValue,
        filterValueType: typeof filterValue,
        itemBoolValueType: typeof itemBoolValue,
        filterBoolValueType: typeof filterBoolValue
      });

      // For boolean values, we need to do an explicit comparison
      // to handle both true and false values correctly
      if (operator === '=') {
        // Use strict equality for boolean comparison
        const result = itemBoolValue === filterBoolValue;
        console.log('Boolean equality result:', { itemBoolValue, filterBoolValue, result });
        return result;
      } else if (operator === '!=') {
        // Use strict inequality for boolean comparison
        const result = itemBoolValue !== filterBoolValue;
        console.log('Boolean inequality result:', { itemBoolValue, filterBoolValue, result });
        return result;
      }

      // If we get here, return false to continue with other comparisons
      return false;
    }

    // Compare based on operator
    switch (operator) {
      case '=':
        return itemValue === filterValue
      case '!=':
        return itemValue !== filterValue
      case '>':
        return itemValue > filterValue
      case '>=':
        return itemValue >= filterValue
      case '<':
        return itemValue < filterValue
      case '<=':
        return itemValue <= filterValue
      case 'contains':
        return String(itemValue).toLowerCase().includes(String(filterValue).toLowerCase())
      case 'startsWith':
        return String(itemValue).toLowerCase().startsWith(String(filterValue).toLowerCase())
      case 'endsWith':
        return String(itemValue).toLowerCase().endsWith(String(filterValue).toLowerCase())
      case 'in':
        // Handle array of values (for enum/status filters)
        if (Array.isArray(filterValue)) {
          // Convert both to lowercase strings for case-insensitive comparison
          const itemValueStr = String(itemValue).toLowerCase()
          return filterValue.some(val => String(val).toLowerCase() === itemValueStr)
        } else if (filterValue) {
          // Handle single value with 'in' operator (fallback)
          return String(itemValue).toLowerCase() === String(filterValue).toLowerCase()
        }
        return false
      default:
        return itemValue === filterValue
    }

  }

  /**
   * Apply sorting to data
   */
  const applySorting = (data: any[], sort: SortConfig): any[] => {
    const { field, direction } = sort
    const multiplier = direction === 'asc' ? 1 : -1

    console.log(`Applying sort: ${field} ${direction}`)

    return [...data].sort((a, b) => {
      const aValue = a[field]
      const bValue = b[field]

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return multiplier
      if (bValue === null || bValue === undefined) return -multiplier

      // Compare based on type
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return multiplier * aValue.localeCompare(bValue)
      }

      // Handle numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return multiplier * (aValue - bValue)
      }

      // Handle dates
      if (aValue instanceof Date && bValue instanceof Date) {
        return multiplier * (aValue.getTime() - bValue.getTime())
      }

      // Handle date strings
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const aDate = new Date(aValue)
        const bDate = new Date(bValue)
        if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
          return multiplier * (aDate.getTime() - bDate.getTime())
        }
      }

      // Default comparison
      return multiplier * (String(aValue).localeCompare(String(bValue)))
    })
  }

  /**
   * Fetch data from API
   */
  const fetchFromApi = async (url: string): Promise<any> => {
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
        // For object filters, convert values based on type
        const processedFilter = { ...value };

        // Auto-detect type if not specified in columns
        const column = config.columns?.find(col => col.key === key);
        const type = column?.type;

        // Convert value based on detected type
        if (processedFilter.value !== undefined) {
          // Special handling for ID fields
          const isIdField = key.toLowerCase().includes('id');
          const isNumericValue = !isNaN(Number(processedFilter.value)) && typeof processedFilter.value !== 'boolean';

          if (isIdField) {
            // For ID fields, preserve the original type
            // If it's a numeric string but the field is named 'id', we keep it as is
            processedFilter.value = processedFilter.value;
          } else if (type === 'number' || (!type && isNumericValue)) {
            // For numeric fields, convert to number
            processedFilter.value = Number(processedFilter.value);
          } else if (type === 'boolean') {
            // For boolean fields, ensure we have a proper boolean value
            if (typeof processedFilter.value === 'string') {
              const boolStr = processedFilter.value.toLowerCase();
              // VERY IMPORTANT: Convert to actual boolean values, not string representations
              processedFilter.value = boolStr === 'true' || boolStr === 'yes' || boolStr === '1' ? true : false;
            } else if (processedFilter.value !== undefined) {
              // Ensure it's a proper boolean
              processedFilter.value = Boolean(processedFilter.value);
            }
            console.log('Sending boolean filter to server:', {
              key,
              value: processedFilter.value,
              type: typeof processedFilter.value,
              valueIsTrue: processedFilter.value === true,
              valueIsFalse: processedFilter.value === false
            });
          }
        }

        params.append(`filter[${key}]`, JSON.stringify(processedFilter))
      } else {
        // For simple filters, try to convert to appropriate type
        const column = config.columns?.find(col => col.key === key);
        const isIdField = key.toLowerCase().includes('id');

        if (isIdField) {
          // For ID fields, preserve the original value
          params.append(`filter[${key}]`, String(value))
        } else if (column?.type === 'number' || (!isNaN(Number(value)) && typeof value !== 'boolean')) {
          // Convert to number if it's a numeric string
          params.append(`filter[${key}]`, String(Number(value)))
        } else {
          params.append(`filter[${key}]`, String(value))
        }
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

    console.log(`Fetching data from API: ${url}?${params.toString()}`)

    try {
      // Make the request
      const response = await fetch(`${url}?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('API response:', result)

      return result
    } catch (error) {
      console.error('Error fetching from API:', error)
      throw error
    }
  }

  /**
   * Load relations data
   */
  const loadRelations = async () => {
    if (!config.relations || !config.relations.length) return

    // Check if config.columns is defined
    if (!config.columns || !Array.isArray(config.columns)) {
      console.error('Error: config.columns is undefined or not an array', config)
      return
    }

    // Get relation columns
    const relationColumns = config.columns.filter(col => col.relation)

    // Skip if no relation columns
    if (!relationColumns.length) return

    // Process each item
    for (const item of state.value.items) {
      for (const column of relationColumns) {
        if (!column.relation) continue

        const { table, foreignKey } = column.relation
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
    console.log('Setting sort:', sort)
    state.value.sort = sort

    // Reload data if using server pagination
    if (config.pagination === 'server') {
      loadData()
    } else if (Array.isArray(state.value.items) && state.value.items.length > 0) {
      // For client-side sorting, we don't need to reload data
      // The displayItems computed property will automatically update
      console.log('Client-side sorting applied')
    }
  }

  /**
   * Set search query
   */
  const setSearch = (query: string) => {
    console.log('Setting search query:', query)
    state.value.searchQuery = query
    state.value.pagination.page = 1 // Reset to first page

    // Reload data if using server pagination
    if (config.pagination === 'server') {
      loadData()
    } else if (Array.isArray(state.value.items) && state.value.items.length > 0) {
      // For client-side search, we don't need to reload data
      // The displayItems computed property will automatically update
      console.log('Client-side search applied')
    }
  }

  /**
   * Set filters
   */
  const setFilters = (filters: FilterSet) => {
    console.log('Setting filters:', filters)
    state.value.filters = filters
    state.value.pagination.page = 1 // Reset to first page

    // Reload data if using server pagination
    if (config.pagination === 'server') {
      loadData()
    } else if (Array.isArray(state.value.items) && state.value.items.length > 0) {
      // For client-side filtering, we don't need to reload data
      // The displayItems computed property will automatically update
      console.log('Client-side filtering applied')
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

    // Process data for client-side pagination
    const processed = processClientData([...state.value.items])

    // Apply pagination
    const { page, perPage } = state.value.pagination
    const start = (page - 1) * perPage
    const end = start + perPage

    return processed.slice(start, end)
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
      const header = columns.map((col: TableColumn) => col.label).join(',')

      // Generate CSV rows
      const rows = items.map((item: any) => {
        return columns.map((col: TableColumn) => {
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
