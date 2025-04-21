import {
  defineNuxtModule,
  addPlugin,
  createResolver,
  addComponentsDir,
  addImportsDir,
  addServerHandler,
} from '@nuxt/kit'

// Module options TypeScript interface definition
export interface ModuleOptions {
  /**
   * Default number of items per page
   * @default 10
   */
  perPage?: number

  /**
   * Default pagination type
   * @default 'client'
   */
  paginationType?: 'client' | 'server'

  /**
   * Enable search functionality by default
   * @default true
   */
  searchable?: boolean

  /**
   * Default theme for the data table
   * @default 'default'
   */
  theme?: string

  /**
   * Custom CSS variables for theming
   */
  themeVars?: Record<string, string>
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-arpix-data-table',
    configKey: 'arpixDataTable',
    compatibility: {
      nuxt: '^3.0.0',
    },
  },
  // Default configuration options of the Nuxt module
  defaults: {
    perPage: 10,
    paginationType: 'client',
    searchable: true,
    theme: 'default',
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Add the plugin
    addPlugin(resolver.resolve('./runtime/plugin'))

    // Register components
    addComponentsDir({
      path: resolver.resolve('./runtime/components'),
      pathPrefix: false,
      prefix: 'Arpix',
      global: true,
    })

    // Register composables
    addImportsDir(resolver.resolve('./runtime/composables'))

    // Register server handlers for API endpoints
    addServerHandler({
      route: '/api/arpix-data-table/:action',
      handler: resolver.resolve('./runtime/server/api/table-engine'),
    })

    // Make options available to the rest of the app
    nuxt.options.runtimeConfig.public.arpixDataTable = options
  },
})
