export default defineNuxtConfig({
  modules: [
    '../src/module',
  ],
  devtools: { enabled: true },
  compatibilityDate: '2025-04-20',

  arpixDataTable: {
    perPage: 10,
    paginationType: 'client',
    searchable: true,
    theme: 'default',
    debug: false, // Set to true to enable debug mode
    i18n: {
      enabled: true,
      defaultLocale: 'es',
      messages: {
        // Custom translations can be added here
        en: {
          // Override or add custom English translations
        },
        es: {
          Name: 'Nombre',
        },
        fr: {
          // Override or add custom French translations
        }
      }
    }
  },
})
