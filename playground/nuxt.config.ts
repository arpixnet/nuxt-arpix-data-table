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
  },
})
