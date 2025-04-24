import { computed } from '#imports'
import { useNuxtApp } from '#app'
import defaultTranslations from '../i18n/translations'

/**
 * Composable for handling i18n in the data table
 */
export function useDataTableI18n() {
  const nuxtApp: any = useNuxtApp()

  // Get the module options
  const config: any = nuxtApp.$arpixDataTable?.config || {
    perPage: 10,
    paginationType: 'client',
    searchable: true,
    theme: 'default',
    debug: false,
    i18n: {
      enabled: true,
      defaultLocale: 'en',
      messages: {}
    }
  }

  // Check if i18n is enabled in the module options
  const i18nEnabled = computed(() => config.i18n?.enabled !== false)

  // Get the default locale from the module options or use 'en'
  const defaultLocale = computed(() => config.i18n?.defaultLocale || 'en')

  // Get custom translations from the module options
  const customTranslations = computed(() => config.i18n?.messages || {})

  // Check if @nuxtjs/i18n is available
  const hasNuxtI18n = computed(() => {
    return typeof nuxtApp.$i18n !== 'undefined'
  })

  // Get the current locale from @nuxtjs/i18n or use the default locale
  const currentLocale = computed(() => {
    const debug = nuxtApp.$arpixDataTable?.config?.debug
    let locale = defaultLocale.value

    if (hasNuxtI18n.value) {
      locale = nuxtApp.$i18n.locale.value || defaultLocale.value
      if (debug) {
        console.log('Using locale from @nuxtjs/i18n:', locale)
      }
    }
    else {
      if (debug) {
        console.log('Using default locale:', locale)
      }
    }

    // Ensure the locale is a valid string
    if (!locale || typeof locale !== 'string') {
      if (debug) {
        console.warn('Invalid locale, falling back to default:', defaultLocale.value)
      }
      locale = defaultLocale.value
    }

    return locale
  })

  // Merge default translations with custom translations
  const messages = computed(() => {
    const result: any = { ...defaultTranslations }
    const debug = nuxtApp.$arpixDataTable?.config?.debug

    if (debug) {
      console.log('Default translations:', defaultTranslations)
      console.log('Custom translations:', customTranslations.value)
    }

    // Merge custom translations
    Object.keys(customTranslations.value).forEach((locale) => {
      if (!result[locale]) {
        result[locale] = { datatable: {} }
      }

      // Process custom translations
      const customLocaleTranslations = customTranslations.value[locale]

      if (debug) {
        console.log(`Processing custom translations for locale '${locale}':`, customLocaleTranslations)
      }

      // Handle dot notation keys (e.g., 'pagination.itemsPerPage')
      Object.keys(customLocaleTranslations).forEach((key) => {
        if (key.includes('.')) {
          const parts = key.split('.')
          let current = result[locale].datatable

          if (debug) {
            console.log(`Processing dot notation key '${key}' with parts:`, parts)
          }

          // Navigate to the nested object
          for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i]
            if (!current[part]) {
              current[part] = {}
            }
            current = current[part]

            if (debug) {
              console.log(`Created/navigated to part '${part}', current:`, current)
            }
          }

          // Set the value at the leaf
          const lastPart = parts[parts.length - 1]
          current[lastPart] = customLocaleTranslations[key]

          if (debug) {
            console.log(`Set value for '${lastPart}' to:`, customLocaleTranslations[key])
          }
        }
        else {
          // Handle regular keys
          result[locale].datatable[key] = customLocaleTranslations[key]

          if (debug) {
            console.log(`Set regular key '${key}' to:`, customLocaleTranslations[key])
          }
        }
      })

      if (debug) {
        console.log(`Final translations for locale '${locale}':`, result[locale])
      }
    })

    return result
  })

  /**
   * Translate a key using @nuxtjs/i18n if available, otherwise use our own translations
   * @param key The translation key
   * @param params Optional parameters for the translation
   * @returns The translated string
   */
  const t = (key: string, params?: Record<string, unknown>) => {
    // If i18n is not enabled, return the key
    if (!i18nEnabled.value) {
      console.log('i18n is disabled, returning key:', key)
      return key
    }

    // Debug
    const debug = nuxtApp.$arpixDataTable?.config?.debug

    // If @nuxtjs/i18n is available, try to use it first
    if (hasNuxtI18n.value) {
      // Check if the key exists in the @nuxtjs/i18n translations
      const i18nKey = `datatable.${key}`
      const translated = nuxtApp.$i18n.t(i18nKey, params)

      if (debug) {
        console.log('Using @nuxtjs/i18n for key:', key)
        console.log('i18nKey:', i18nKey)
        console.log('translated:', translated)
      }

      // If the translation exists and is not the same as the key, return it
      if (translated && translated !== i18nKey) {
        return translated
      }
    }

    // Otherwise, use our own translations
    const locale = currentLocale.value
    const parts = key.split('.')

    if (debug) {
      console.log('Using own translations for key:', key)
      console.log('Current locale:', locale)
      console.log('Parts:', parts)
      console.log('Available messages:', Object.keys(messages.value))
      console.log('Available translations for locale:', messages.value[locale])
    }

    // Get the translation from our messages
    let translation = messages.value[locale]?.datatable

    if (debug) {
      console.log('Initial translation object:', translation)
    }

    for (const part of parts) {
      if (!translation || typeof translation !== 'object') {
        if (debug) {
          console.log(`Translation not found for part '${part}', returning key:`, key)
        }
        return key // Key not found
      }
      translation = translation[part]

      if (debug) {
        console.log(`After processing part '${part}', translation:`, translation)
      }
    }

    // If the translation is not found, try to use the default locale
    if (!translation && locale !== defaultLocale.value) {
      if (debug) {
        console.log('Translation not found in current locale, trying default locale:', defaultLocale.value)
      }

      translation = messages.value[defaultLocale.value]?.datatable

      if (debug) {
        console.log('Default locale translation object:', translation)
      }

      for (const part of parts) {
        if (!translation || typeof translation !== 'object') {
          if (debug) {
            console.log(`Translation not found in default locale for part '${part}', returning key:`, key)
          }
          return key // Key not found
        }
        translation = translation[part]

        if (debug) {
          console.log(`After processing part '${part}' in default locale, translation:`, translation)
        }
      }
    }

    // If the translation is still not found, return the key
    if (!translation) {
      if (debug) {
        console.log('Translation still not found, returning key:', key)
      }
      return key
    }

    // Replace parameters in the translation
    let result = translation

    if (params) {
      Object.keys(params).forEach((param) => {
        result = result.replace(`{${param}}`, params[param])
      })
    }

    if (debug) {
      console.log('Final translation result for key:', key, 'is:', result)
    }

    return result
  }

  return {
    t,
    currentLocale,
    defaultLocale,
    i18nEnabled,
    hasNuxtI18n,
  }
}
