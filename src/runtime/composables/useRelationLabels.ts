import { ref } from 'vue'

// Create a global store for relation labels
const relationLabels = ref<Record<string, Record<string, string>>>({})

/**
 * Composable for managing relation labels
 */
export function useRelationLabels() {
  /**
   * Set a relation label
   * @param relationKey The relation key (e.g., 'department_id')
   * @param id The relation ID
   * @param label The human-readable label
   */
  const setRelationLabel = (relationKey: string, id: string | number, label: string) => {
    if (!relationLabels.value[relationKey]) {
      relationLabels.value[relationKey] = {}
    }
    relationLabels.value[relationKey][String(id)] = label
  }

  /**
   * Get a relation label
   * @param relationKey The relation key (e.g., 'department_id')
   * @param id The relation ID
   * @returns The human-readable label or undefined if not found
   */
  const getRelationLabel = (relationKey: string, id: string | number): string | undefined => {
    return relationLabels.value[relationKey]?.[String(id)]
  }

  /**
   * Check if a relation label exists
   * @param relationKey The relation key (e.g., 'department_id')
   * @param id The relation ID
   * @returns True if the label exists, false otherwise
   */
  const hasRelationLabel = (relationKey: string, id: string | number): boolean => {
    return !!relationLabels.value[relationKey]?.[String(id)]
  }

  return {
    relationLabels,
    setRelationLabel,
    getRelationLabel,
    hasRelationLabel,
  }
}
