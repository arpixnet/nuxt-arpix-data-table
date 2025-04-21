import { defineEventHandler, getQuery, getRouterParam, createError } from 'h3'
import type { FilterSet, SortConfig, PaginationConfig } from '../../types'

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
