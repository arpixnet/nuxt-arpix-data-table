import { ref, reactive, watch, onMounted } from '#imports'
import { parse, format, isValid, parseISO, isSameDay, startOfDay } from 'date-fns'
import type {
  TableConfig,
  TableState,
  SortConfig,
  FilterSet,
  TableColumn
} from '../types'

/**
   * Interface for export options
   */
export interface ExportOptions {
  /**
   * File name for the exported file (without extension)
   */
  fileName?: string;

  /**
   * Columns to include in the export (defaults to all columns)
   */
  columns?: TableColumn[];

  /**
   * Items to export (defaults to current table items)
   */
  items?: Record<string, any>[];

  /**
   * Whether to apply current filters (default: true)
   */
  applyFilters?: boolean;

  /**
   * Whether to apply current search (default: true)
   */
  applySearch?: boolean;

  /**
   * CSV specific options
   */
  csv?: {
    /**
     * Delimiter character (default: ',')
     */
    delimiter?: string;

    /**
     * Whether to include headers (default: true)
     */
    includeHeaders?: boolean;
  };

  /**
   * Excel specific options
   */
  excel?: {
    /**
     * Sheet name (default: 'Data')
     */
    sheetName?: string;

    /**
     * Whether to style headers (default: true)
     */
    styleHeaders?: boolean;

    /**
     * Whether to auto-size columns (default: true)
     */
    autoSize?: boolean;
  };

  /**
   * PDF specific options
   */
  pdf?: {
    /**
     * Page orientation (default: 'portrait')
     */
    orientation?: 'portrait' | 'landscape';

    /**
     * Page unit (default: 'mm')
     */
    unit?: string;

    /**
     * Page format (default: 'a4')
     */
    format?: string | [number, number];

    /**
     * Document title (default: 'Data Export')
     */
    title?: string;

    /**
     * Whether to include date (default: true)
     */
    includeDate?: boolean;
  };
}

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

      // Direct assignment for array data sources to ensure data is loaded
      if (Array.isArray(config.dataSource)) {
        state.value.items = [...config.dataSource]
      }

      // Handle different types of data sources
      if (Array.isArray(config.dataSource)) {
        // Array data source
        data = [...config.dataSource]

        // Apply client-side pagination, sorting, filtering
        if (config.pagination === 'client') {
          data = processClientData(data)
        }
      } else if (typeof config.dataSource === 'function') {
        // Function data source (client-side only)
        try {
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
        if (config.debug) {
          console.log('API response in loadData:', apiResponse)
        }

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
            if (config.debug) {
              console.warn('Unexpected API response format:', apiResponse)
            }
            data = []
          }
        } else {
          if (config.debug) {
            console.warn('Invalid API response:', apiResponse)
          }
          data = []
        }
      } else if (typeof config.dataSource === 'object') {
        // Object data source (assuming it has items property)
        data = (config.dataSource as any).items || []
      }

      // Update state
      state.value.items = data
      if (config.debug) {
        console.log('Data loaded, items:', state.value.items)
      }

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
    if (config.debug) {
      console.log('Processing client data, items:', data.length)
    }
    let processed = [...data]

    // Apply search
    if (state.value.searchQuery) {
      processed = applySearch(processed, state.value.searchQuery)
      if (config.debug) {
        console.log('After search:', processed.length, 'items')
      }
    }

    // Apply filters
    if (Object.keys(state.value.filters).length > 0) {
      if (config.debug) {
        console.log('Applying filters in processClientData:', state.value.filters)
      }
      processed = applyFilters(processed, state.value.filters)
      if (config.debug) {
        console.log('After filters:', processed.length, 'items')
      }
    }

    // Apply sorting
    if (state.value.sort) {
      if (config.debug) {
        console.log('Applying sort in processClientData:', state.value.sort)
      }
      processed = applySorting(processed, state.value.sort)
      if (config.debug) {
        console.log('After sorting:', processed.length, 'items')
      }
    } else if (config.debug) {
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

    if (config.debug) {
      console.log('Applying search with query:', query)
    }

    // Check if config.columns is defined
    if (!config.columns || !Array.isArray(config.columns)) {
      console.error('Error: config.columns is undefined or not an array', config)
      return data
    }

    // Get columns that can be searched (text fields only, not explicitly set to filterable: false)
    const searchableColumns = config.columns.filter(col => {
      // Skip columns that are explicitly set to not filterable
      if (col.filterable === false) return false;

      // Skip columns with specific types that are not text
      if (col.type === 'number' || col.type === 'boolean' || col.type === 'date') return false;

      // Include all other columns (assumed to be text/string)
      return true;
    });

    // Log which columns are searchable and which are excluded
    const excludedColumns = config.columns.filter(col => {
      // Skip columns that are already not filterable
      if (col.filterable === false) return false;

      // Include columns with specific types that are not text
      return col.type === 'number' || col.type === 'boolean' || col.type === 'date';
    });

    if (config.debug) {
      console.log('Searchable columns (text only):', searchableColumns.map(col => col.key));
      console.log('Excluded columns from search:', excludedColumns.map(col => `${col.key} (${col.type})`));
    }

    if (searchableColumns.length === 0) {
      if (config.debug) {
        console.warn('No searchable columns found. Make sure columns have filterable: true')
      }
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

        // Skip if the value appears to be a non-string type
        if (typeof value === 'number' || typeof value === 'boolean') {
          return false;
        }
        if (value instanceof Date) {
          return false;
        }

        // Skip if the value looks like a date string
        if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
          // Check if it matches common date formats
          if (/^\d{4}-\d{2}-\d{2}/.test(value) || // ISO format
              /^\d{2}[/-]\d{2}[/-]\d{4}/.test(value)) { // MM/DD/YYYY or DD/MM/YYYY
                if (config.debug) console.log(`Skipping search in column ${column.key}: value looks like a date`, value);
            return false;
          }
        }

        // Skip if the value is a numeric string
        if (typeof value === 'string' && !Number.isNaN(Number(value)) && value.trim() !== '') {
          // Only skip if it's a pure number (no letters)
          // eslint-disable-next-line regexp/no-unused-capturing-group
          if (/^-?\d+(\.\d+)?$/.test(value)) {
            if (config.debug) console.log(`Skipping search in column ${column.key}: value is numeric string`, value);
            return false;
          }
        }

        // Convert to string and check if it includes the query
        try {
          const stringValue = String(value).toLowerCase()
          const matches = stringValue.includes(lowerQuery)

          // For debugging
          if (matches && config.debug) {
            console.log(`Match found in column ${column.key}:`, { value, query: lowerQuery })
          }

          return matches
        } catch (error) {
          if (config.debug) {
            console.error(`Error searching in column ${column.key}:`, error)
          }
          return false
        }
      })
    })

    if (config.debug) {
      console.log(`Search results: ${filteredData.length} items found out of ${data.length}`)
    }
    return filteredData
  }

  /**
   * Apply filters to data
   */
  const applyFilters = (data: any[], filters: FilterSet): any[] => {
    if (config.debug) {
      console.log('Applying filters:', filters)
    }

    if (!filters || Object.keys(filters).length === 0) {
      return data
    }

    const filteredData = data.filter(item => {
      return Object.entries(filters).every(([key, filter]) => {
        // Skip empty filters, but be careful with boolean false values
        if (!filter) {
          return true;
        }

        if (typeof filter === 'object') {
          // For boolean filters, we need to check if value is explicitly false
          const isBooleanFilter = filter.value === false;
          const isEmpty = filter.value === undefined || filter.value === null || filter.value === '';

          if (isEmpty && !isBooleanFilter) {
            return true;
          }
        }

        // Get column definition to determine type
        const column = config.columns?.find(col => col.key === key);

        // Handle simple filters (key: value)
        if (typeof filter !== 'object') {
          const result = compareValues(item[key], filter, '=', column?.type);
          return result;
        }

        // Handle complex filters
        const { field, operator, value } = filter;
        const itemValue = item[field || key];

        // Special debug for boolean filters
        if (column?.type === 'boolean' || typeof itemValue === 'boolean') {
          if (config.debug) console.log(`Boolean filter check for ${key}:`, {
            itemValue,
            filterValue: value,
            operator,
            itemValueType: typeof itemValue,
            filterValueType: typeof value,
            item,
          });
        }

        const result = compareValues(itemValue, value, operator, column?.type);
        if (config.debug) {
          console.log(`Complex filter for ${key}:`, { itemValue, filterValue: value, operator, result });
        }
        return result;
      });
    });

    if (config.debug) {
      console.log('Filtered data:', filteredData.length, 'items out of', data.length);
    }
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
        if (config.debug) {
          console.log('Special case: comparing null/undefined with false');
        }
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
                (typeof itemValue === 'string' && !Number.isNaN(Date.parse(itemValue)))) {
        type = 'date';
      }
    }

    // Special handling for ID fields
    const isIdField = operator === '=' && (filterValue !== undefined) &&
                     (String(itemValue).toLowerCase().includes('id') ||
                      String(filterValue).toLowerCase().includes('id'));

    // Check if both values are numeric strings or numbers
    const bothNumeric = !Number.isNaN(Number(itemValue)) && !Number.isNaN(Number(filterValue));

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
        // Parse dates using date-fns to handle different formats and avoid timezone issues
        let itemDate: Date | null = null;
        let filterDate: Date | null = null;

        // Parse item value to Date
        if (typeof itemValue === 'string') {
          // Try to parse the date string
          if (itemValue.includes('/')) {
            // Handle DD/MM/YYYY format
            itemDate = parse(itemValue, 'dd/MM/yyyy', new Date());
            if (!isValid(itemDate)) {
              // Try MM/DD/YYYY format as fallback
              itemDate = parse(itemValue, 'MM/dd/yyyy', new Date());
            }
          } else {
            // Try ISO format (YYYY-MM-DD)
            itemDate = parseISO(itemValue);
          }

          // If parsing failed, log error
          if (!isValid(itemDate)) {
            if (config.debug) {
              console.error('Failed to parse item date:', itemValue);
            }
            return false;
          }
        } else if (itemValue instanceof Date) {
          itemDate = itemValue;
        } else {
          if (config.debug) {
            console.error('Invalid date value:', itemValue);
          }
          return false;
        }

        // Parse filter value to Date
        if (typeof filterValue === 'string') {
          // Try to parse the date string
          if (filterValue.includes('/')) {
            // Handle DD/MM/YYYY format
            filterDate = parse(filterValue, 'dd/MM/yyyy', new Date());
            if (!isValid(filterDate)) {
              // Try MM/DD/YYYY format as fallback
              filterDate = parse(filterValue, 'MM/dd/yyyy', new Date());
            }
          } else {
            // Try ISO format (YYYY-MM-DD)
            filterDate = parseISO(filterValue);
          }

          // If parsing failed, log error
          if (!isValid(filterDate)) {
            if (config.debug) {
              console.error('Failed to parse filter date:', filterValue);
            }
            return false;
          }
        } else if (filterValue instanceof Date) {
          filterDate = filterValue;
        } else {
          if (config.debug) {
            console.error('Invalid filter date value:', filterValue);
          }
          return false;
        }

        // Normalize dates to start of day to ignore time components
        const itemDateNormalized = startOfDay(itemDate);
        const filterDateNormalized = startOfDay(filterDate);

        // Format dates for display and debugging
        const itemFormatted = format(itemDateNormalized, 'dd/MM/yyyy');
        const filterFormatted = format(filterDateNormalized, 'dd/MM/yyyy');

        // Check if dates are the same day (ignoring time)
        const equal = isSameDay(itemDateNormalized, filterDateNormalized);

        if (config.debug) {
          console.log('Comparing dates with date-fns:', {
            original: { itemValue, filterValue },
            parsed: { itemDate, filterDate },
            normalized: { itemDateNormalized, filterDateNormalized },
            formatted: { itemFormatted, filterFormatted },
            equal,
            operator
          });
        }

        // For equality and inequality comparisons, we can use isSameDay
        if (operator === '=') {
          return equal;
        } else if (operator === '!=') {
          return !equal;
        }

        // For other comparisons, we need to compare the normalized dates
        // Replace the original values with the normalized date objects for comparison
        itemValue = itemDateNormalized;
        filterValue = filterDateNormalized;
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

      // For boolean values, we need to do an explicit comparison
      // to handle both true and false values correctly
      if (operator === '=') {
        // Use strict equality for boolean comparison
        const result = itemBoolValue === filterBoolValue;
        return result;
      } else if (operator === '!=') {
        // Use strict inequality for boolean comparison
        const result = itemBoolValue !== filterBoolValue;
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

    if (config.debug) {
      console.log(`Applying sort: ${field} ${direction}`)
    }

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
        if (!Number.isNaN(aDate.getTime()) && !Number.isNaN(bDate.getTime())) {
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
      // Get column definition to determine type
      const column = config.columns?.find(col => col.key === key);
      const type = column?.type;

      // Special handling for relation filters
      if (type === 'relation') {
        // For relation filters, we just send the ID value directly
        if (config.debug) {
          console.log('Processing relation filter:', {
            key,
            value,
            type,
            relationConfig: column?.relation,
            valueType: typeof value
          });
        }

        // If value is an object with a value property, extract that
        let filterValue = value;
        if (typeof value === 'object' && value !== null && 'value' in value) {
          filterValue = value.value;
        }

        // Ensure we're sending a string value
        params.append(`filter[${key}]`, String(filterValue));
        return; // Skip further processing for this filter
      }

      if (typeof value === 'object') {
        // For object filters, convert values based on type
        const processedFilter: any = { ...value };

        // Convert value based on detected type
        if (processedFilter.value !== undefined) {
          // Special handling for ID fields
          const isIdField = key.toLowerCase().includes('id');
          const isNumericValue = !Number.isNaN(Number(processedFilter.value)) && typeof processedFilter.value !== 'boolean';

          if (isIdField) {
            // For ID fields, preserve the original type
            // If it's a numeric string but the field is named 'id', we keep it as is
            // eslint-disable-next-line no-self-assign
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
            if (config.debug) {
              console.log('Sending boolean filter to server:', {
                key,
                value: processedFilter.value,
                type: typeof processedFilter.value,
                valueIsTrue: processedFilter.value === true,
                valueIsFalse: processedFilter.value === false
              });
            }
          }
        }

        params.append(`filter[${key}]`, JSON.stringify(processedFilter))
      } else {
        // For simple filters, try to convert to appropriate type
        const isIdField = key.toLowerCase().includes('id');

        if (isIdField) {
          // For ID fields, preserve the original value
          params.append(`filter[${key}]`, String(value))
        } else if (type === 'number' || (!Number.isNaN(Number(value)) && typeof value !== 'boolean')) {
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

    if (config.debug) {
      console.log(`Fetching data from API: ${url}?${params.toString()}`)
    }

    try {
      // Make the request
      const response = await fetch(`${url}?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      if (config.debug) {
        console.log('API response:', result)
      }

      return result
    } catch (error) {
      if (config.debug) {
        console.error('Error fetching from API:', error)
      }
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
      if (config.debug) {
        console.error('Error: config.columns is undefined or not an array', config)
      }
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
      // For playground, use the playground endpoint
      const isPlayground = window.location.pathname.includes('/playground')
      const endpoint = isPlayground ? '/api/playground/relation' : '/api/arpix-data-table/relation'

      const response = await fetch(`${endpoint}?table=${table}&id=${id}`)

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
    if (config.debug) {
      console.log('Setting sort:', sort)
    }
    state.value.sort = sort

    // Reload data if using server pagination
    if (config.pagination === 'server') {
      loadData()
    } else if (Array.isArray(state.value.items) && state.value.items.length > 0) {
      // For client-side sorting, we don't need to reload data
      // The displayItems computed property will automatically update
      if (config.debug) {
        console.log('Client-side sorting applied')
      }
    }
  }

  /**
   * Set search query
   */
  const setSearch = (query: string) => {
    if (config.debug) {
      console.log('Setting search query:', query)
    }
    state.value.searchQuery = query
    state.value.pagination.page = 1 // Reset to first page

    // Reload data if using server pagination
    if (config.pagination === 'server') {
      loadData()
    } else if (Array.isArray(state.value.items) && state.value.items.length > 0) {
      // For client-side search, we don't need to reload data
      // The displayItems computed property will automatically update
      if (config.debug) {
        console.log('Client-side search applied')
      }
    }
  }

  /**
   * Set filters
   */
  const setFilters = (filters: FilterSet) => {
    if (config.debug) {
      console.log('Setting filters:', filters)
    }
    state.value.filters = filters
    state.value.pagination.page = 1 // Reset to first page

    // Reload data if using server pagination
    if (config.pagination === 'server') {
      loadData()
    } else if (Array.isArray(state.value.items) && state.value.items.length > 0) {
      // For client-side filtering, we don't need to reload data
      // The displayItems computed property will automatically update
      if (config.debug) {
        console.log('Client-side filtering applied')
      }
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
   * Export data to various formats (CSV, Excel, PDF)
   * @param format - The format to export to ('csv', 'excel', 'pdf')
   * @param options - Configuration options for the export
   * @param data - Optional data to export. If not provided, will use the current table data
   * @returns Promise that resolves when the export is complete
   */
  const exportData = async (
    format: 'csv' | 'excel' | 'pdf',
    options: Partial<ExportOptions> = {},
    data?: Record<string, any>[]
  ): Promise<{ success: boolean; format: string; fileName: string }> => {
    if (config.debug) {
      console.log(`Exporting data to ${format}`, options);
    }

    try {
      // Get data to export
      const exportItems = data || options.items || state.value.items;
      const columns = options.columns || config.columns;
      const fileName = options.fileName || `export_${new Date().toISOString().slice(0, 10)}`;

      // Apply filters, search, and sorting if requested
      let processedData = exportItems;
      if (options.applyFilters !== false) {
        // Apply search if active
        if (state.value.searchQuery && options.applySearch !== false) {
          processedData = applySearch(processedData, state.value.searchQuery);
        }

        // Apply filters if active
        if (Object.keys(state.value.filters).length > 0) {
          processedData = applyFilters(processedData, state.value.filters);
        }

        // Apply sorting if active
        if (state.value.sort) {
          processedData = applySorting(processedData, state.value.sort);
        }
      }

      // Export based on format
      if (format === 'csv') {
        await exportToCSV(processedData, columns, fileName, options);
      } else if (format === 'excel') {
        await exportToExcel(processedData, columns, fileName, options);
      } else if (format === 'pdf') {
        await exportToPDF(processedData, columns, fileName, options);
      } else {
        throw new Error(`Unsupported export format: ${format}`);
      }

      return { success: true, format, fileName };
    } catch (error) {
      if (config.debug) {
        console.error(`Error exporting data to ${format}:`, error);
      }
      throw error;
    }
  };

  /**
   * Export data to CSV format
   */
  const exportToCSV = async (
    data: Record<string, any>[],
    columns: TableColumn[],
    fileName: string,
    options: Partial<ExportOptions>
  ): Promise<void> => {
    // Get CSV specific options
    const csvOptions = options.csv || {};
    const delimiter = csvOptions.delimiter || ',';
    const includeHeaders = csvOptions.includeHeaders !== false;

    // Generate CSV header if needed
    const headerRow = columns.map((col: TableColumn) => col.label).join(delimiter);

    // Generate CSV rows
    const dataRows = data.map((item: Record<string, any>) => {
      return columns.map((col: TableColumn) => {
        let value = item[col.key];

        // Format value based on column type
        if (col.format) {
          if (typeof col.format === 'function') {
            // If format is a function, call it directly
            value = col.format(value, item);
          } else if (col.type === 'date' || col.format === 'date-format') {
            // Handle date formatting
            if (value) {
              value = new Date(value).toLocaleDateString();
            }
          } else if (col.type === 'boolean' || col.format === 'boolean-format') {
            // Handle boolean formatting
            value = value ? 'Yes' : 'No';
          } else if (col.format === 'currency-format' && typeof value === 'number') {
            // Handle currency formatting
            value = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
          } else if (col.format === 'status-format' && col.statusColors && value) {
            // For status format, just use the raw value
            value = String(value);
          }
        } else if (col.type === 'date' && value) {
          value = new Date(value).toLocaleDateString();
        } else if (col.type === 'boolean') {
          value = value ? 'Yes' : 'No';
        }

        // Escape quotes and wrap in quotes
        if (value !== undefined && value !== null) {
          const stringValue = String(value).replace(/"/g, '""');
          return `"${stringValue}"`;
        }
        return '""';
      }).join(delimiter);
    });

    // Combine header and rows
    const csvContent = includeHeaders
      ? [headerRow, ...dataRows].join('\n')
      : dataRows.join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.csv`;
    a.click();

    // Clean up
    URL.revokeObjectURL(url);
  };

  /**
   * Export data to Excel format using ExcelJS
   */
  const exportToExcel = async (
    data: Record<string, any>[],
    columns: TableColumn[],
    fileName: string,
    options: Partial<ExportOptions>
  ): Promise<void> => {
    // Get Excel specific options
    const excelOptions = options.excel || {};
    const sheetName = excelOptions.sheetName || 'Data';
    const styleHeaders = excelOptions.styleHeaders !== false;
    const autoSize = excelOptions.autoSize !== false;

    // Dynamically import ExcelJS only when needed
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheetName);

      // Add header row
      const headerRow = worksheet.addRow(columns.map((col) => col.label));

      // Style header row if requested
      if (styleHeaders) {
        headerRow.font = { bold: true };
      }

      // Add data rows
      data.forEach((item) => {
        const rowData = columns.map((col) => {
          let value = item[col.key];

          // Format value based on column type
          if (col.format && typeof col.format === 'function') {
            value = col.format(value, item);
          } else if (col.type === 'date' && value) {
            value = new Date(value);
          } else if (col.type === 'boolean') {
            value = value ? 'Yes' : 'No';
          }

          return value !== undefined && value !== null ? value : '';
        });

        worksheet.addRow(rowData);
      });

      // Auto-size columns if requested
      if (autoSize) {
        worksheet.columns.forEach((column: any) => {
          let maxLength = 0;
          column.eachCell({ includeEmpty: true }, (cell: any) => {
            const columnLength = cell.value ? String(cell.value).length : 10;
            if (columnLength > maxLength) {
              maxLength = columnLength;
            }
          });
          column.width = Math.min(maxLength + 2, 50); // Maximum width of 50
        });
      }

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.xlsx`;
      a.click();

      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw new Error('Failed to export to Excel. ExcelJS library may be missing.');
    }
  };

  /**
   * Export data to PDF format using jsPDF
   */
  const exportToPDF = async (
    data: Record<string, any>[],
    columns: TableColumn[],
    fileName: string,
    options: Partial<ExportOptions>
  ): Promise<void> => {
    // Get PDF specific options
    const pdfOptions = options.pdf || {};
    const orientation = pdfOptions.orientation || 'portrait';
    const unit = pdfOptions.unit || 'mm';
    const format = pdfOptions.format || 'a4';
    const title = pdfOptions.title || 'Data Export';
    const includeDate = pdfOptions.includeDate !== false;

    try {
      // Dynamically import jsPDF only when needed
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default;

      // Create new PDF document
      const doc = new jsPDF({
        orientation,
        unit: unit as "pt" | "px" | "mm" | "cm" | "in" | "pc" | "em" | "ex",
        format,
      });

      // Set title
      doc.setFontSize(18);
      doc.text(title, 14, 22);

      // Add date if requested
      if (includeDate) {
        doc.setFontSize(11);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
      }

      // Create table
      const tableData = [];

      // Add header row
      tableData.push(columns.map((col) => col.label));

      // Add data rows
      data.forEach((item) => {
        const rowData = columns.map((col) => {
          let value = item[col.key];

          // Format value based on column type
          if (col.format && typeof col.format === 'function') {
            value = col.format(value, item);
          } else if (col.type === 'date' && value) {
            value = new Date(value).toLocaleDateString();
          } else if (col.type === 'boolean') {
            value = value ? 'Yes' : 'No';
          }

          return value !== undefined && value !== null ? String(value) : '';
        });

        tableData.push(rowData);
      });

      // Add table to document
      doc.setFontSize(10);

      // Check if autoTable plugin is available
      if (typeof (doc as any).autoTable === 'function') {
        (doc as any).autoTable({
          startY: 40,
          head: [tableData[0]],
          body: tableData.slice(1),
          theme: 'grid',
          styles: {
            fontSize: 8,
            cellPadding: 2,
          },
          headStyles: {
            fillColor: [66, 139, 202],
            textColor: 255,
          },
        });
      } else {
        // Fallback to simple table if autoTable is not available
        let y = 40;
        const rowHeight = 10;
        const colWidth = 180 / columns.length;

        // Draw header
        doc.setFillColor(66, 139, 202);
        doc.setTextColor(255);
        doc.rect(14, y, 180, rowHeight, 'F');

        tableData[0].forEach((header, i) => {
          doc.text(String(header), 14 + (i * colWidth), y + 7);
        });

        // Draw rows
        doc.setTextColor(0);
        tableData.slice(1).forEach((row, rowIndex) => {
          y += rowHeight;

          // Alternate row background
          if (rowIndex % 2 === 0) {
            doc.setFillColor(240, 240, 240);
            doc.rect(14, y, 180, rowHeight, 'F');
          }

          // Draw cell text
          row.forEach((cell, i) => {
            doc.text(String(cell).substring(0, 25), 14 + (i * colWidth), y + 7);
          });
        });
      }

      // Save PDF
      doc.save(`${fileName}.pdf`);
    } catch (error: unknown) {
      console.error('Error exporting to PDF:', error);
      if (config.debug) {
        console.log('You may need to install the jsPDF library: npm install jspdf');
        // Check if error has a message property and it includes 'autoTable'
        if (error instanceof Error && error.message.includes('autoTable')) {
          console.log('For better tables, install jspdf-autotable: npm install jspdf-autotable');
        }
      }
      throw new Error('Failed to export to PDF. Required libraries may be missing.');
    }
  };

  // Watch for config changes
  watch(() => config.perPage, (newPerPage: any) => {
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
