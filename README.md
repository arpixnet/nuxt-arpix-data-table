# Nuxt Arpix Data Table

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

A highly configurable data table module for Nuxt 3 with advanced features like pre-formatting, relation handling, and more.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)
- [📊 &nbsp;Column Configuration](./docs/column-configuration.md)
- [🔍 &nbsp;Filtering System](./docs/filtering.md)
- [📤 &nbsp;Data Export](./docs/export.md)
- [🎨 &nbsp;Theming](./docs/theming.md)
- [📚 &nbsp;API Reference](./docs/api-reference.md)
- [🧩 &nbsp;Reusable Components](./docs/components.md)

## Features

- 📊 &nbsp;Highly configurable data tables with TypeScript support
- 🔄 &nbsp;Client and server-side pagination, sorting, and filtering
- 🔍 &nbsp;Built-in search functionality (configurable to trigger on Enter)
- 🎨 &nbsp;Customizable themes with CSS variables
- 🔗 &nbsp;Support for complex data relations and Hasura-like APIs
- 📱 &nbsp;Responsive design with table and card views
- 🧩 &nbsp;Slot system for custom cell rendering
- 📝 &nbsp;Pre-formatting system for data display (status, boolean, date, etc.)
- 📊 &nbsp;Reusable components (ProgressBar, TagsList)
- 🌐 &nbsp;Internationalization (i18n) support compatible with @nuxtjs/i18n
- 📤 &nbsp;Data export capabilities (CSV, Excel, PDF)
- 💾 &nbsp;State persistence (filtering, search, pagination, sorting) - Coming soon
- 🔍 &nbsp;Advanced filtering system with multiple operators
- 🎛️ &nbsp;Configurable row density (normal, compact)
- 🐞 &nbsp;Debug mode for development

## Quick Setup

Install the module to your Nuxt application:

```bash
# Using Nuxt CLI (recommended)
npx nuxi module add nuxt-arpix-data-table

# Or using npm/yarn
npm install nuxt-arpix-data-table
# or
yarn add nuxt-arpix-data-table
```

Add the module to your `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: [
    'nuxt-arpix-data-table'
  ],
  arpixDataTable: {
    // Module options
    perPage: 10,
    paginationType: 'client',
    searchable: true,
    theme: 'default',
    i18n: {
      enabled: true,
      defaultLocale: 'en'
    }
  }
})
```

That's it! You can now use Arpix Data Table in your Nuxt app ✨


## Contribution

<details>
  <summary>Local development</summary>

  ```bash
  # Install dependencies
  npm install

  # Generate type stubs
  npm run dev:prepare

  # Develop with the playground
  npm run dev

  # Build the playground
  npm run dev:build

  # Run ESLint
  npm run lint

  # Run Vitest
  npm run test
  npm run test:watch

  # Release new version
  npm run release
  ```

</details>


## Basic Usage

```vue
<template>
  <ArpixDataTable
    :columns="columns"
    :data-source="data"
  />
</template>

<script setup>
import { ref } from 'vue'

const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Name', sortable: true, filterable: true },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' }
]

const data = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
  // More data...
]
</script>
```

## Advanced Usage

### Server-side Pagination

```vue
<template>
  <ArpixDataTable
    :columns="columns"
    data-source="/api/users"
    pagination="server"
    :per-page="10"
  />
</template>
```

### Custom Formatting

```vue
<script setup>
const columns = [
  // ...
  {
    key: 'price',
    label: 'Price',
    sortable: true,
    format: (value) => `$${value.toFixed(2)}`
  },
  {
    key: 'status',
    label: 'Status',
    format: (value) => {
      const classes = {
        active: 'status-active',
        inactive: 'status-inactive',
        pending: 'status-pending'
      }
      return `<span class="status-badge ${classes[value]}">${value}</span>`
    }
  }
]
</script>

<style>
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-active {
  background-color: #d1fae5;
  color: #065f46;
}

.status-inactive {
  background-color: #fee2e2;
  color: #b91c1c;
}

.status-pending {
  background-color: #fef3c7;
  color: #92400e;
}
</style>
```

### Using Slots for Custom Rendering

```vue
<template>
  <ArpixDataTable :columns="columns" :data-source="data">
    <template #cell(actions)="{ row }">
      <button @click="editItem(row)">Edit</button>
      <button @click="deleteItem(row)">Delete</button>
    </template>
  </ArpixDataTable>
</template>
```

### Using Reusable Components

The module includes reusable components that can be used in your tables or anywhere in your application:

```vue
<template>
  <ArpixDataTable :columns="columns" :data-source="data">
    <!-- Progress bar for percentage values -->
    <template #cell(progress)="{ value }">
      <ProgressBar :value="value" :show-label="true" suffix="%" />
    </template>

    <!-- Tags list for array values -->
    <template #cell(tags)="{ value }">
      <TagsList
        :tags="value"
        :color-map="tagColors"
        :clickable="true"
        @tag-click="handleTagClick"
      />
    </template>
  </ArpixDataTable>
</template>

<script setup>
const tagColors = {
  'Frontend': '#ede9fe',
  'Backend': '#f3e8ff',
  'API': '#fae8ff'
}

const handleTagClick = (tag) => {
  // Handle tag click event
}
</script>
```

See the [Components Documentation](./docs/components.md) for more details.

### Advanced Filtering

The data table provides a powerful filtering system with support for different column types:

```vue
<template>
  <ArpixDataTable
    :columns="columns"
    :data-source="data"
  />
</template>

<script setup>
const columns = [
  // Text column with filtering
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    filterable: true,
    type: 'text' // Default type
  },

  // Number column with filtering
  {
    key: 'age',
    label: 'Age',
    sortable: true,
    filterable: true,
    type: 'number'
  },

  // Date column with filtering
  {
    key: 'birthdate',
    label: 'Birth Date',
    sortable: true,
    filterable: true,
    type: 'date'
  },

  // Boolean column with filtering
  {
    key: 'active',
    label: 'Active',
    sortable: true,
    filterable: true,
    type: 'boolean'
  },

  // Enum/Status column with predefined values
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    filterable: true,
    type: 'custom',
    format: 'status-format',
    enumValues: ['Active', 'Inactive', 'Pending'],
    statusColors: {
      'Active': { background: '#dcfce7', text: '#166534', border: '#166534' },
      'Inactive': { background: '#f3f4f6', text: '#4b5563', border: '#4b5563' },
      'Pending': { background: '#fef9c3', text: '#854d0e', border: '#854d0e' }
    }
  },

  // Relation column with filtering
  {
    key: 'department_id',
    label: 'Department',
    sortable: true,
    filterable: true,
    type: 'relation',
    relation: {
      table: 'department',
      displayField: 'name',
      foreignKey: 'department_id',
      apiEndpoint: '/api/departments/options'
    }
  }
]
</script>
```

Each column type has specific filter operators:
- **Text**: Contains, Equals, Starts with, Ends with
- **Number**: Equals, Not equals, Greater than, Less than, etc.
- **Date**: After, Before, Between
- **Boolean**: True/False selection
- **Relation**: Selection from available options

### Debug Mode

The data table includes a debug mode that shows additional information in the UI and console logs, which is helpful during development:

```vue
<template>
  <ArpixDataTable
    :columns="columns"
    :data-source="data"
    :debug="true"
  />
</template>
```

You can also enable debug mode globally in your nuxt.config.ts:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-arpix-data-table'],
  arpixDataTable: {
    // ... other options
    debug: true
  }
})
```

When debug mode is enabled, you'll see:
- Console logs for data loading, filtering, sorting, etc.
- Debug information in the table UI
- Error messages with more details

### Internationalization (i18n)

The data table supports internationalization and is compatible with @nuxtjs/i18n:

```vue
<template>
  <ArpixDataTable
    :columns="columns"
    :data-source="data"
  />
</template>
```

You can configure i18n in your nuxt.config.ts:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    'nuxt-arpix-data-table',
    '@nuxtjs/i18n'
  ],
  arpixDataTable: {
    i18n: {
      enabled: true,
      defaultLocale: 'en',
      messages: {
        // Custom translations
        pt: {
          // Portuguese translations
          'pagination.itemsPerPage': '{count} por página',
          'pagination.of': 'de',
          'pagination.nextPage': 'Próxima página',
          'pagination.previousPage': 'Página anterior',
          'pagination.firstPage': 'Primeira página',
          'pagination.lastPage': 'Última página',
          'search.placeholder': 'Pesquisar...',
          'search.clear': 'Limpar pesquisa',
          'filters.title': 'Filtros ativos:',
          'filters.clearAll': 'Limpar tudo',
          'filters.apply': 'Aplicar',
          // ... more translations
        }
      }
    }
  },
  i18n: {
    // @nuxtjs/i18n configuration
    locales: ['en', 'es', 'fr', 'pt'],
    defaultLocale: 'en'
  }
})
```

The module will use translations from @nuxtjs/i18n if available, otherwise it will use its own translations.

## Configuration Options

### Module Options

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-arpix-data-table'],
  arpixDataTable: {
    // Pagination options
    perPage: 10,                // Default items per page
    paginationType: 'client',   // 'client' or 'server'

    // Feature flags
    searchable: true,           // Enable search functionality by default
    debug: false,               // Enable debug mode (shows debug info in console and UI)

    // Appearance
    theme: 'default',           // Default theme ('default' or 'dark')
    themeVars: {                // Custom CSS variables for theming
      // Table appearance
      // 'primary-color': '#8b5cf6',       // Purple instead of default blue
      // 'header-background': '#f5f3ff',   // Light purple background for header
      // 'header-text-color': '#6d28d9',   // Dark purple text for header
      // 'border-color': '#e9d5ff',        // Light purple border
      // 'hover-color': '#faf5ff',         // Very light purple for row hover

      // Component appearance
      // 'progress-bg': '#f0f0f0',         // Custom progress bar background
      // 'tag-bg': '#e5e7eb',              // Custom tag background

      // Note: For filter window styling, use global CSS with !important:
      // :root {
      //   --arpix-filter-menu-bg: #f8f5ff !important;      // Background for filter menu
      //   --arpix-filter-apply-bg: #8b5cf6 !important;     // Background for Apply button
      //   --arpix-filter-apply-hover-bg: #7c3aed !important; // Apply button hover
      //   --arpix-input-bg: #f5f3ff !important;            // Background for input fields
      // }
    },

    // Internationalization
    i18n: {
      enabled: true,            // Enable i18n support
      defaultLocale: 'en',      // Default locale
      messages: {               // Custom translations
        // Example of how to add translations:
        // pt: {
        //   'pagination.itemsPerPage': '{count} por página',
        //   'pagination.of': 'de',
        //   'pagination.nextPage': 'Próxima página',
        //   // ... more translations
        // }
      }
    },

    // State persistence (cookies) - Coming soon
    // statePersistence: {
    //   enabled: true,            // Enable state persistence
    //   cookiePrefix: 'arpix-dt', // Prefix for cookie names
    //   persist: ['filters', 'search', 'pagination', 'sort'] // State to persist
    // }
  }
})
```

### Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `Array<TableColumn>` | `[]` | Table column definitions |
| `dataSource` | `Array/String/Object` | `[]` | Data source for the table (array, API endpoint, or object) |
| `perPage` | `Number` | `10` | Items per page |
| `pagination` | `String` | `'client'` | Pagination type ('client' or 'server') |
| `searchable` | `Boolean` | `true` | Enable search functionality |
| `selectable` | `Boolean` | `false` | Enable row selection |
| `theme` | `String` | `'default'` | Theme name ('default' or 'dark') |
| `density` | `String` | `'normal'` | Row density ('normal' or 'compact') |
| `tableClass` | `String` | `''` | Additional CSS class for the table |
| `themeVars` | `Object` | `{}` | Custom CSS variables for theming |
| `showHeader` | `Boolean` | `true` | Show table header |
| `showFooter` | `Boolean` | `true` | Show table footer |
| `showPagination` | `Boolean` | `true` | Show pagination controls |
| `showSearch` | `Boolean` | `true` | Show search input |
| `loading` | `Boolean` | `false` | Show loading state |
| `error` | `String` | `''` | Error message to display |
| `noDataText` | `String` | `'No data available'` | Text to display when there are no results |
| `debug` | `Boolean` | `false` | Enable debug mode |
| `initialSort` | `Object` | `null` | Initial sort configuration |
| `initialFilters` | `Object` | `{}` | Initial filters configuration |
| `initialPage` | `Number` | `1` | Initial page number |
| `relations` | `Array` | `[]` | Relations configuration for Hasura-like APIs |

#### Column Configuration

Each column in the `columns` array can have the following properties:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `key` | `String` | - | Unique identifier for the column (required) |
| `label` | `String` | - | Display label for the column header (required) |
| `sortable` | `Boolean` | `false` | Whether the column is sortable |
| `filterable` | `Boolean` | `false` | Whether the column is filterable |
| `type` | `String` | `'text'` | Data type ('text', 'number', 'date', 'boolean', 'relation', 'custom') |
| `format` | `Function/String` | - | Formatter function or predefined format name |
| `width` | `String` | - | Column width (CSS value, e.g., '200px', '20%') |
| `align` | `String` | `'left'` | Text alignment ('left', 'center', 'right') |
| `visible` | `Boolean` | `true` | Whether the column is visible |
| `enumValues` | `Array` | - | Possible values for enum/status fields (used for filtering) |
| `statusColors` | `Object` | - | Custom colors for status values |
| `relation` | `Object` | - | Configuration for relation columns |

See the [Column Configuration Documentation](./docs/column-configuration.md) for more details.

### Data Export

The data table supports exporting data in various formats:

```vue
<template>
  <div>
    <ArpixDataTable
      ref="dataTable"
      :columns="columns"
      :data-source="data"
    />
    <div class="export-buttons">
      <button @click="exportToCsv">Export to CSV</button>
      <button @click="exportToExcel">Export to Excel</button>
      <button @click="exportToPdf">Export to PDF</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const dataTable = ref(null)

const exportToCsv = async () => {
  if (!dataTable.value) return

  try {
    const result = await dataTable.value.exportData('csv', {
      fileName: 'my-data-export',
      // Apply current filters and search
      applyFilters: true,
      applySearch: true
    })
    console.log('Export successful:', result)
  } catch (error) {
    console.error('Export failed:', error)
  }
}

const exportToExcel = async () => {
  if (!dataTable.value) return

  try {
    const result = await dataTable.value.exportData('excel', {
      fileName: 'my-data-export',
      excel: {
        sheetName: 'My Data',
        styleHeaders: true,
        autoSize: true
      }
    })
    console.log('Export successful:', result)
  } catch (error) {
    console.error('Export failed:', error)
  }
}

const exportToPdf = async () => {
  if (!dataTable.value) return

  try {
    const result = await dataTable.value.exportData('pdf', {
      fileName: 'my-data-export',
      pdf: {
        orientation: 'landscape',
        title: 'My Data Export',
        includeDate: true
      }
    })
    console.log('Export successful:', result)
  } catch (error) {
    console.error('Export failed:', error)
  }
}
</script>
```

> Note: Excel export requires the `exceljs` library, and PDF export requires the `jspdf` library. You can install them with `npm install exceljs jspdf` or `yarn add exceljs jspdf`.

### State Persistence (Coming Soon)

The data table will soon support saving the state of filtering, search, pagination, and sorting in cookies, allowing users to return to the same view when they revisit the page:

```ts
// nuxt.config.ts (Coming soon)
export default defineNuxtConfig({
  modules: ['nuxt-arpix-data-table'],
  arpixDataTable: {
    // ... other options
    statePersistence: {
      enabled: true,
      cookiePrefix: 'my-app-dt', // Customize cookie names
      persist: ['filters', 'search', 'pagination', 'sort'] // State to persist
    }
  }
})
```

You will also be able to control state persistence at the component level:

```vue
<!-- Coming soon -->
<template>
  <ArpixDataTable
    :columns="columns"
    :data-source="data"
    :persist-state="true"
    persist-key="users-table" // Unique key for this table
  />
</template>
```

> Note: This feature is currently under development and will be available in a future release.

## License

[MIT License](./LICENSE)

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-arpix-data-table/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/nuxt-arpix-data-table

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-arpix-data-table.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/nuxt-arpix-data-table

[license-src]: https://img.shields.io/npm/l/nuxt-arpix-data-table.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/nuxt-arpix-data-table

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com
