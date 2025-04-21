import { defineEventHandler, getQuery, getRouterParam, createError } from 'h3'
import type { FilterSet, SortConfig, PaginationConfig } from '../../types'
import { parse, format, isValid, parseISO, isSameDay, startOfDay } from 'date-fns'

/**
 * Main API handler for the data table engine
 */
export default defineEventHandler(async (event) => {
  try {
    // Get action from route parameter
    const action = getRouterParam(event, 'action')

    // Get query parameters
    const query = getQuery(event)

    // Parse pagination parameters
    const page = parseInt(query.page as string) || 1
    const perPage = parseInt(query.perPage as string) || 10

    // Parse sort parameter
    let sort: SortConfig | null = null
    if (query.sort) {
      const [field, direction] = (query.sort as string).split(':')
      sort = {
        field,
        direction: (direction as 'asc' | 'desc') || 'asc'
      }
    }

    // Parse filters
    const filters: FilterSet = {}
    Object.keys(query).forEach(key => {
      if (key.startsWith('filter[') && key.endsWith(']')) {
        const filterKey = key.slice(7, -1)
        try {
          // Try to parse as JSON
          filters[filterKey] = JSON.parse(query[key] as string)
        } catch {
          // Fall back to string value
          filters[filterKey] = query[key]
        }
      }
    })

    // Parse search query
    const search = query.search as string || ''

    // Parse relations
    const relations = query.with ? (query.with as string).split(',') : []

    // Handle different actions
    switch (action) {
      case 'data':
        return await handleDataRequest(event, { page, perPage, sort, filters, search, relations })

      case 'relation':
        return await handleRelationRequest(event, query)

      case 'export':
        return await handleExportRequest(event, { format: query.format as string, filters, sort, search })

      default:
        throw createError({
          statusCode: 400,
          statusMessage: `Unknown action: ${action}`
        })
    }
  } catch (error: any) {
    console.error('Table engine error:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Internal server error'
    })
  }
})

/**
 * Handle data request
 */
async function handleDataRequest(event: any, options: {
  page: number
  perPage: number
  sort: SortConfig | null
  filters: FilterSet
  search: string
  relations: string[]
}) {
  // This is a placeholder implementation
  // In a real app, you'd implement this based on your data source

  // Mock data for demonstration
  const mockData = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    description: `Description for item ${i + 1}`,
    date: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    status: Math.random() > 0.5 ? 'active' : 'inactive',
    price: Math.round(Math.random() * 10000) / 100
  }))

  // Apply filters
  let filteredData = mockData

  if (Object.keys(options.filters).length > 0) {
    filteredData = mockData.filter(item => {
      return Object.entries(options.filters).every(([key, filter]) => {
        // Skip empty filters
        if (!filter) return true

        // Handle simple filters (key: value)
        if (typeof filter !== 'object') {
          return item[key as keyof typeof item] === filter
        }

        // Handle complex filters
        const { field, operator, value } = filter
        const itemValue = item[field as keyof typeof item]

        // Special handling for boolean fields
        if (typeof value === 'boolean' || (typeof value === 'string' && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false'))) {
          // Convert filter value to boolean - VERY IMPORTANT: use actual boolean values
          let boolValue: boolean;
          if (typeof value === 'boolean') {
            boolValue = value;
          } else if (typeof value === 'string') {
            boolValue = value.toLowerCase() === 'true';
          } else {
            boolValue = !!value;
          }

          // Convert itemValue to boolean - VERY IMPORTANT: use actual boolean values
          let itemBoolValue: boolean;
          if (typeof itemValue === 'boolean') {
            itemBoolValue = itemValue;
          } else if (typeof itemValue === 'string') {
            const itemStr = itemValue.toLowerCase();
            itemBoolValue = itemStr === 'true' || itemStr === 'yes' || itemStr === '1';
          } else if (typeof itemValue === 'number') {
            itemBoolValue = itemValue === 1;
          } else {
            itemBoolValue = false;
          }

          console.log('Server comparing boolean values:', {
            itemValue,
            itemBoolValue,
            filterValue: value,
            boolValue,
            operator,
            result: itemBoolValue === boolValue,
            strictEqual: Object.is(itemBoolValue, boolValue),
            boolValueType: typeof boolValue,
            itemBoolValueType: typeof itemBoolValue,
            boolValueIsTrue: boolValue === true,
            boolValueIsFalse: boolValue === false,
            itemBoolValueIsTrue: itemBoolValue === true,
            itemBoolValueIsFalse: itemBoolValue === false
          });

          // For boolean values, we need to do an explicit comparison
          if (operator === '=') {
            // Use strict equality for boolean comparison
            const result = itemBoolValue === boolValue;
            console.log('Boolean equality check:', {
              itemBoolValue,
              boolValue,
              result,
              itemValueType: typeof itemValue,
              filterValueType: typeof value,
              itemBoolValueType: typeof itemBoolValue,
              boolValueType: typeof boolValue,
              boolValueIsTrue: boolValue === true,
              boolValueIsFalse: boolValue === false
            });
            return result;
          } else if (operator === '!=') {
            // Use strict inequality for boolean comparison
            const result = itemBoolValue !== boolValue;
            console.log('Boolean inequality check:', {
              itemBoolValue,
              boolValue,
              result,
              itemValueType: typeof itemValue,
              boolValueType: typeof boolValue
            });
            return result;
          }

          // If we get here, return false to continue with other comparisons
          return false;
        }

        // Special handling for dates
        if (typeof itemValue === 'string' && typeof value === 'string') {
          // Check if both values look like dates
          const isItemDate = !isNaN(Date.parse(itemValue));
          const isFilterDate = !isNaN(Date.parse(value));

          if (isItemDate && isFilterDate) {
            try {
              // Parse dates using date-fns
              let itemDate: Date | null = null;
              let filterDate: Date | null = null;

              // Parse item value
              if (itemValue.includes('/')) {
                // Try DD/MM/YYYY format
                itemDate = parse(itemValue, 'dd/MM/yyyy', new Date());
                if (!isValid(itemDate)) {
                  // Try MM/DD/YYYY format as fallback
                  itemDate = parse(itemValue, 'MM/dd/yyyy', new Date());
                }
              } else {
                // Try ISO format (YYYY-MM-DD)
                itemDate = parseISO(itemValue);
              }

              // Parse filter value
              if (value.includes('/')) {
                // Try DD/MM/YYYY format
                filterDate = parse(value, 'dd/MM/yyyy', new Date());
                if (!isValid(filterDate)) {
                  // Try MM/DD/YYYY format as fallback
                  filterDate = parse(value, 'MM/dd/yyyy', new Date());
                }
              } else {
                // Try ISO format (YYYY-MM-DD)
                filterDate = parseISO(value);
              }

              // Check if both dates are valid
              if (isValid(itemDate) && isValid(filterDate)) {
                // Normalize dates to start of day to ignore time components
                const itemDateNormalized = startOfDay(itemDate);
                const filterDateNormalized = startOfDay(filterDate);

                // Check if dates are the same day (ignoring time)
                const equal = isSameDay(itemDateNormalized, filterDateNormalized);

                console.log('Server comparing dates with date-fns:', {
                  original: { itemValue, filterValue: value },
                  parsed: { itemDate, filterDate },
                  normalized: { itemDateNormalized, filterDateNormalized },
                  formatted: {
                    itemFormatted: format(itemDateNormalized, 'dd/MM/yyyy'),
                    filterFormatted: format(filterDateNormalized, 'dd/MM/yyyy')
                  },
                  equal,
                  operator
                });

                // Handle equality and inequality operators
                if (operator === '=') {
                  return equal;
                } else if (operator === '!=') {
                  return !equal;
                } else if (operator === '>') {
                  return itemDateNormalized > filterDateNormalized;
                } else if (operator === '>=') {
                  return itemDateNormalized >= filterDateNormalized;
                } else if (operator === '<') {
                  return itemDateNormalized < filterDateNormalized;
                } else if (operator === '<=') {
                  return itemDateNormalized <= filterDateNormalized;
                }
              }
            } catch (e) {
              console.error('Error comparing dates:', e);
            }
          }
        }

        // Special handling for ID fields
        const isIdField = field.toLowerCase().includes('id');
        const bothNumeric = !isNaN(Number(itemValue)) && !isNaN(Number(value));

        // For ID fields with equality operator, we need special handling
        if (isIdField && operator === '=') {
          if (bothNumeric) {
            // If both are numeric, compare as numbers
            return Number(itemValue) === Number(value);
          }
          // Otherwise compare as strings
          return String(itemValue) === String(value);
        }

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
          case 'in':
            // Handle array of values (for enum/status filters)
            if (Array.isArray(value)) {
              // Convert both to lowercase strings for case-insensitive comparison
              const itemValueStr = String(itemValue).toLowerCase()
              return value.some(val => String(val).toLowerCase() === itemValueStr)
            } else if (value) {
              // Handle single value with 'in' operator (fallback)
              return String(itemValue).toLowerCase() === String(value).toLowerCase()
            }
            return false
          default:
            return itemValue === value
        }
      })
    })
  }

  // Apply search
  if (options.search) {
    const lowerSearch = options.search.toLowerCase()
    filteredData = filteredData.filter(item => {
      return Object.values(item).some(value =>
        value && String(value).toLowerCase().includes(lowerSearch)
      )
    })
  }

  // Apply sorting
  if (options.sort) {
    const { field, direction } = options.sort
    const multiplier = direction === 'asc' ? 1 : -1

    filteredData.sort((a, b) => {
      const aValue = a[field as keyof typeof a]
      const bValue = b[field as keyof typeof b]

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return multiplier
      if (bValue === null || bValue === undefined) return -multiplier

      // Compare based on type
      if (typeof aValue === 'string') {
        return multiplier * aValue.localeCompare(String(bValue))
      }

      return multiplier * (Number(aValue) - Number(bValue))
    })
  }

  // Calculate total
  const total = filteredData.length

  // Apply pagination
  const start = (options.page - 1) * options.perPage
  const end = start + options.perPage
  const paginatedData = filteredData.slice(start, end)

  // Return paginated data with metadata
  return {
    items: paginatedData,
    pagination: {
      page: options.page,
      perPage: options.perPage,
      total
    }
  }
}

/**
 * Handle relation request
 */
async function handleRelationRequest(event: any, query: any) {
  const table = query.table as string
  const id = query.id

  if (!table || !id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing table or id parameter'
    })
  }

  // This is a placeholder implementation
  // In a real app, you'd fetch the relation data from your data source

  // Mock relation data for demonstration
  const mockRelations: Record<string, Record<string, any>> = {
    users: {
      1: { id: 1, name: 'John Doe', email: 'john@example.com' },
      2: { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      3: { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
    },
    categories: {
      1: { id: 1, name: 'Electronics', slug: 'electronics' },
      2: { id: 2, name: 'Clothing', slug: 'clothing' },
      3: { id: 3, name: 'Books', slug: 'books' }
    }
  }

  // Get relation data
  const relationData = mockRelations[table]?.[id]

  if (!relationData) {
    throw createError({
      statusCode: 404,
      statusMessage: `Relation not found: ${table}:${id}`
    })
  }

  return relationData
}

/**
 * Handle export request
 */
async function handleExportRequest(event: any, options: {
  format: string
  filters: FilterSet
  sort: SortConfig | null
  search: string
}) {
  // This is a placeholder implementation
  // In a real app, you'd generate the export file based on the data

  // Validate format
  if (!['csv', 'excel', 'pdf'].includes(options.format)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Unsupported export format: ${options.format}`
    })
  }

  // Get all data (no pagination)
  const { items } = await handleDataRequest(event, {
    page: 1,
    perPage: 1000, // Get a large number of items
    sort: options.sort,
    filters: options.filters,
    search: options.search,
    relations: []
  })

  // Return success message
  return {
    success: true,
    format: options.format,
    count: items.length,
    message: `Export to ${options.format} completed successfully`
  }
}
