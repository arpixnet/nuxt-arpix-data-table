export default defineNuxtConfig({
  modules: [
    '../src/module'
  ],

  arpixDataTable: {
    perPage: 10,
    paginationType: 'client',
    searchable: true,
    theme: 'default'
  },

  devtools: { enabled: true },
  compatibilityDate: '2025-04-20',
})