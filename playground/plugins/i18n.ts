import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  // Only run on client-side
  if (process.client) {
    // Get the locale from the cookie
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(';').shift()
      return null
    }

    // Get the locale from the cookie
    const localeFromCookie = getCookie('arpix-locale')

    // Get the locale from the URL query parameters
    const urlParams = new URLSearchParams(window.location.search)
    const localeParam = urlParams.get('locale')

    // Use the locale from the URL query parameters if available, otherwise use the cookie
    const locale = localeParam || localeFromCookie

    // If we have a locale, set it in the config
    if (locale) {
      // Get the available locales
      const availableLocales = ['en', 'es', 'fr', 'pt']

      // Only set the locale if it's valid
      if (availableLocales.includes(locale)) {
        // Set the locale in the config
        nuxtApp.$config.public.arpixDataTable.i18n.defaultLocale = locale
      }
    }
  }
})
