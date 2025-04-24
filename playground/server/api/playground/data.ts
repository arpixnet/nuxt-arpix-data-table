import { defineEventHandler, getQuery, createError } from 'h3'
import type { FilterSet, SortConfig } from '../../../../src/runtime/types'

/**
 * Playground API endpoint that simulates a real-world Hasura-like API response
 * This endpoint replaces /api/arpix-data-table/data for demonstration purposes
 */
export default defineEventHandler(async (event) => {
  try {
    // Get query parameters
    const query = getQuery(event)

    // Parse pagination parameters
    const page = Number.parseInt(query.page as string, 10) || 1
    const perPage = Number.parseInt(query.perPage as string, 10) || 10

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
    Object.keys(query).forEach((key) => {
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
    // Always include department and project relations for this demo
    const relations = query.with ? (query.with as string).split(',') : ['department', 'project']

    // Generate Hasura-like mock data
    const { items, total } = generateHasuraLikeData(page, perPage, sort, filters, search, relations)

    // Return paginated data with metadata in Hasura-like format
    return {
      items,
      pagination: {
        page,
        perPage,
        total
      }
    }
  } catch (error: unknown) {
    console.error('Playground API error:', error)
    throw createError({
      statusCode: (error as { statusCode?: number }).statusCode || 500,
      statusMessage: (error as Error).message || 'Internal server error'
    })
  }
})

/**
 * Generate mock data in a Hasura-like format
 */
function generateHasuraLikeData(
  page: number,
  perPage: number,
  sort: SortConfig | null,
  filters: FilterSet,
  search: string,
  relations: string[],
) {
  // Create departments data (for relations)
  const departments = [
    { id: 1, name: 'Engineering', code: 'ENG', location: 'Building A' },
    { id: 2, name: 'Marketing', code: 'MKT', location: 'Building B' },
    { id: 3, name: 'Sales', code: 'SLS', location: 'Building C' },
    { id: 4, name: 'Human Resources', code: 'HR', location: 'Building D' },
    { id: 5, name: 'Finance', code: 'FIN', location: 'Building E' }
  ]

  // Create projects data (for relations)
  const projects = [
    { id: 1, name: 'Website Redesign', budget: 50000, status: 'active' },
    { id: 2, name: 'Mobile App Development', budget: 75000, status: 'active' },
    { id: 3, name: 'Database Migration', budget: 30000, status: 'completed' },
    { id: 4, name: 'Cloud Infrastructure', budget: 100000, status: 'active' },
    { id: 5, name: 'Security Audit', budget: 25000, status: 'pending' }
  ]

  // Create employees data with relations to departments and projects
  const mockData = Array.from({ length: 100 }, (_, i) => {
    const id = i + 1
    const departmentId = Math.floor(Math.random() * 5) + 1
    const projectId = Math.floor(Math.random() * 5) + 1

    return {
      id,
      first_name: `First${id}`,
      last_name: `Last${id}`,
      email: `employee${id}@example.com`,
      hire_date: new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0],
      salary: Math.round(50000 + Math.random() * 50000),
      is_active: Math.random() > 0.2, // 80% active
      status: ['active', 'on_leave', 'terminated'][Math.floor(Math.random() * 3)],
      department_id: departmentId,
      project_id: projectId,
      // Include relation data if requested
      // Use the table name as specified in the column relation config
      ...(relations.includes('department') || relations.includes('departments')
        ? {
            department: departments[departmentId - 1],
            departments: departments[departmentId - 1] // Include both singular and plural forms
          }
        : {}),
      ...(relations.includes('project') || relations.includes('projects')
        ? {
            project: projects[projectId - 1],
            projects: projects[projectId - 1] // Include both singular and plural forms
          }
        : {})
    }
  })

  // Apply filters
  let filteredData = mockData
  if (Object.keys(filters).length > 0) {
    filteredData = mockData.filter((item) => {
      return Object.entries(filters).every(([key, filter]) => {
        // Skip empty filters
        if (!filter) return true

        // Special handling for relation fields (department_id, project_id)
        if ((key === 'department_id' || key === 'project_id') && (typeof filter === 'string' || typeof filter === 'number')) {
          // For relation fields, we compare the ID directly
          const itemValue = item[key as keyof typeof item]
          // Convert both to strings for comparison to handle numeric vs string IDs
          const result = String(itemValue) === String(filter)
          return result
        }

        // Handle simple filters (key: value)
        if (typeof filter !== 'object') {
          return item[key as keyof typeof item] === filter
        }

        // Handle complex filters
        const { field, operator, value } = filter
        const itemValue = item[field as keyof typeof item]

        // Handle different operators
        switch (operator) {
          case '=':
            return itemValue === value
          case '!=':
            return itemValue !== value
          case '>':
            return itemValue !== undefined && itemValue > value
          case '>=':
            return itemValue !== undefined && itemValue >= value
          case '<':
            return itemValue !== undefined && itemValue < value
          case '<=':
            return itemValue !== undefined && itemValue <= value
          case 'contains':
            return String(itemValue).toLowerCase().includes(String(value).toLowerCase())
          case 'startsWith':
            return String(itemValue).toLowerCase().startsWith(String(value).toLowerCase())
          case 'endsWith':
            return String(itemValue).toLowerCase().endsWith(String(value).toLowerCase())
          case 'in':
            if (Array.isArray(value)) {
              return value.includes(itemValue)
            }
            return false
          default:
            return itemValue === value
        }
      })
    })
  }

  // Apply search
  if (search) {
    const lowerSearch = search.toLowerCase()
    filteredData = filteredData.filter((item) => {
      // Only search in string fields
      return ['first_name', 'last_name', 'email', 'status'].some((field) => {
        const value = item[field as keyof typeof item]
        return value && String(value).toLowerCase().includes(lowerSearch)
      })
    })
  }

  // Apply sorting
  if (sort) {
    const { field, direction } = sort
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
  const start = (page - 1) * perPage
  const end = start + perPage
  const paginatedData = filteredData.slice(start, end)

  return {
    items: paginatedData,
    total
  }
}
