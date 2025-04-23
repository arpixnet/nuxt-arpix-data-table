import { defineEventHandler, getQuery, createError } from 'h3'

/**
 * Playground API endpoint that provides relation options for filters
 * This simulates a real-world API that would fetch options from a database
 */
export default defineEventHandler(async (event) => {
  try {
    // Get query parameters
    const query = getQuery(event)
    const table = query.table as string

    if (!table) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing table parameter'
      })
    }

    // Return mock data based on the requested table
    switch (table.toLowerCase()) {
      case 'department':
      case 'departments':
        return [
          { id: 1, name: 'Engineering', code: 'ENG', location: 'Building A' },
          { id: 2, name: 'Marketing', code: 'MKT', location: 'Building B' },
          { id: 3, name: 'Sales', code: 'SLS', location: 'Building C' },
          { id: 4, name: 'Human Resources', code: 'HR', location: 'Building D' },
          { id: 5, name: 'Finance', code: 'FIN', location: 'Building E' }
        ]

      case 'project':
      case 'projects':
        return [
          { id: 1, name: 'Website Redesign', budget: 50000, status: 'active' },
          { id: 2, name: 'Mobile App Development', budget: 75000, status: 'active' },
          { id: 3, name: 'Database Migration', budget: 30000, status: 'completed' },
          { id: 4, name: 'Cloud Infrastructure', budget: 100000, status: 'active' },
          { id: 5, name: 'Security Audit', budget: 25000, status: 'pending' }
        ]

      default:
        // Return empty array for unknown tables
        console.warn(`Unknown relation table requested: ${table}`)
        return []
    }
  } catch (error: unknown) {
    console.error('Playground relation options API error:', error)
    throw createError({
      statusCode: (error as { statusCode?: number }).statusCode || 500,
      statusMessage: (error as Error).message || 'Internal server error'
    })
  }
})
