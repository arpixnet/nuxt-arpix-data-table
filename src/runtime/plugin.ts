import { defineNuxtPlugin } from '#app'
import ProgressBar from './components/ProgressBar.vue'
import TagsList from './components/TagsList.vue'

export default defineNuxtPlugin((nuxtApp) => {
  // Access the module options from runtime config
  const config = nuxtApp.$config.public.arpixDataTable

  // Register components globally
  nuxtApp.vueApp.component('ProgressBar', ProgressBar)
  nuxtApp.vueApp.component('TagsList', TagsList)

  return {
    provide: {
      arpixDataTable: {
        version: '1.0.0',
        config,
      },
    },
  }
})
