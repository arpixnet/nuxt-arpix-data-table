import { defineEventHandler, getQuery, createError } from 'h3'

/**
 * Playground API endpoint that simulates a relation endpoint
 * This endpoint replaces /api/arpix-data-table/relation for demonstration purposes
 */
export default defineEventHandler(async (event) => {
  try {
    // Get query parameters
    const query = getQuery(event)
    const table = query.table as string
    const id = query.id

    if (!table || !id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing table or id parameter'
      })
    }

    // Mock relation data for demonstration
    const mockRelations: Record<string, Record<string, any>> = {
      departments: {
        1: { id: 1, name: 'Engineering', code: 'ENG', location: 'Building A' },
        2: { id: 2, name: 'Marketing', code: 'MKT', location: 'Building B' },
        3: { id: 3, name: 'Sales', code: 'SLS', location: 'Building C' },
        4: { id: 4, name: 'Human Resources', code: 'HR', location: 'Building D' },
        5: { id: 5, name: 'Finance', code: 'FIN', location: 'Building E' }
      },
      projects: {
        1: { id: 1, name: 'Website Redesign', budget: 50000, status: 'active' },
        2: { id: 2, name: 'Mobile App Development', budget: 75000, status: 'active' },
        3: { id: 3, name: 'Database Migration', budget: 30000, status: 'completed' },
        4: { id: 4, name: 'Cloud Infrastructure', budget: 100000, status: 'active' },
        5: { id: 5, name: 'Security Audit', budget: 25000, status: 'pending' }
      }
    }

    // Get relation data
    const relationData = mockRelations[table]?.[id as string]

    if (!relationData) {
      throw createError({
        statusCode: 404,
        statusMessage: `Relation not found: ${table}:${id}`
      })
    }

    return relationData
  } catch (error: unknown) {
    console.error('Playground API error:', error)
    throw createError({
      statusCode: (error as { statusCode?: number }).statusCode || 500,
      statusMessage: (error as Error).message || 'Internal server error'
    })
  }
})
