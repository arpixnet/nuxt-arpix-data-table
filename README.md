# Nuxt Arpix Data Table

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

A highly configurable data table module for Nuxt 3 with advanced features like pre-formatting, relation handling, and more.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)

## Features

- 📊 &nbsp;Highly configurable data tables with TypeScript support
- 🔄 &nbsp;Client and server-side pagination, sorting, and filtering
- 🔍 &nbsp;Built-in search functionality
- 🎨 &nbsp;Customizable themes with CSS variables
- 🔗 &nbsp;Support for complex data relations
- 📱 &nbsp;Responsive design for all screen sizes
- 🧩 &nbsp;Slot system for custom cell rendering
- 📝 &nbsp;Pre-formatting system for data display
- 📊 &nbsp;Reusable components (ProgressBar, TagsList)
- 🌐 &nbsp;Internationalization (i18n) support
- 📤 &nbsp;Data export capabilities
- 🔄 &nbsp;Optimized rendering for large datasets

## Quick Setup

Install the module to your Nuxt application:

```bash
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
  console.log(`Tag clicked: ${tag}`)
}
</script>
```

See the [Components Documentation](./docs/components.md) for more details.

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
        en: {
          // Override English translations
          pagination: {
            itemsPerPage: '{count} items per page'
          }
        },
        es: {
          // Spanish translations
        }
      }
    }
  },
  i18n: {
    // @nuxtjs/i18n configuration
    locales: ['en', 'es', 'fr'],
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
    perPage: 10,            // Default items per page
    paginationType: 'client', // 'client' or 'server'
    searchable: true,       // Enable search by default
    theme: 'default',       // Default theme
    i18n: {
      enabled: true,        // Enable i18n support
      defaultLocale: 'en',  // Default locale
      messages: {}          // Custom translations
    }
  }
})
```

### Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `Array` | `[]` | Table column definitions |
| `dataSource` | `Array/String/Function` | `[]` | Data source for the table |
| `perPage` | `Number` | `10` | Items per page |
| `pagination` | `String` | `'client'` | Pagination type ('client' or 'server') |
| `searchable` | `Boolean` | `true` | Enable search functionality |
| `selectable` | `Boolean` | `false` | Enable row selection |
| `theme` | `String` | `'default'` | Theme name |
| `tableClass` | `String` | `''` | Additional CSS class for the table |
| `showHeader` | `Boolean` | `true` | Show table header |
| `showFooter` | `Boolean` | `true` | Show table footer |
| `showPagination` | `Boolean` | `true` | Show pagination controls |
| `showSearch` | `Boolean` | `true` | Show search input |

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
