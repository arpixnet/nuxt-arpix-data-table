import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  // Access the module options from runtime config
  const config = nuxtApp.$config.public.arpixDataTable

  return {
    provide: {
      arpixDataTable: {
        version: '1.0.0',
        config,
      },
    },
  }
})
