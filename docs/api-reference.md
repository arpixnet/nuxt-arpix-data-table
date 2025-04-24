# API Reference

This document provides a comprehensive reference for the nuxt-arpix-data-table module.

## Module Options

These options can be set in your `nuxt.config.ts` file:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-arpix-data-table'],
  arpixDataTable: {
    // Options here
  }
})
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `perPage` | `number` | `10` | Default number of items per page |
| `paginationType` | `'client' \| 'server'` | `'client'` | Default pagination type |
| `searchable` | `boolean` | `true` | Enable search functionality by default |
| `theme` | `string` | `'default'` | Default theme ('default' or 'dark') |
| `themeVars` | `Record<string, string>` | `{}` | Custom CSS variables for theming |
| `debug` | `boolean` | `false` | Enable debug mode |
| `i18n.enabled` | `boolean` | `true` | Enable i18n support |
| `i18n.defaultLocale` | `string` | `'en'` | Default locale |
| `i18n.messages` | `Record<string, Record<string, string>>` | `{}` | Custom translations |
| `statePersistence.enabled` | `boolean` | `true` | Enable state persistence (Coming soon) |
| `statePersistence.cookiePrefix` | `string` | `'arpix-dt'` | Prefix for cookie names (Coming soon) |
| `statePersistence.persist` | `string[]` | `['filters', 'search', 'pagination', 'sort']` | State to persist (Coming soon) |

## Component Props

These props can be set on the `ArpixDataTable` component:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `Array<TableColumn>` | `[]` | Table column definitions |
| `dataSource` | `Array/String/Object` | `[]` | Data source for the table |
| `perPage` | `number` | `10` | Items per page |
| `pagination` | `'client' \| 'server'` | `'client'` | Pagination type |
| `searchable` | `boolean` | `true` | Enable search functionality |
| `selectable` | `boolean` | `false` | Enable row selection |
| `theme` | `string` | `'default'` | Theme name |
| `density` | `'normal' \| 'compact'` | `'normal'` | Row density |
| `tableClass` | `string` | `''` | Additional CSS class for the table |
| `themeVars` | `Record<string, string>` | `{}` | Custom CSS variables for theming |
| `showHeader` | `boolean` | `true` | Show table header |
| `showFooter` | `boolean` | `true` | Show table footer |
| `showPagination` | `boolean` | `true` | Show pagination controls |
| `showSearch` | `boolean` | `true` | Show search input |
| `loading` | `boolean` | `false` | Show loading state |
| `error` | `string` | `''` | Error message to display |
| `noDataText` | `string` | `'No data available'` | Text to display when there are no results |
| `debug` | `boolean` | `false` | Enable debug mode |
| `initialSort` | `SortConfig` | `null` | Initial sort configuration |
| `initialFilters` | `FilterSet` | `{}` | Initial filters configuration |
| `initialPage` | `number` | `1` | Initial page number |
| `relations` | `RelationConfig[]` | `[]` | Relations configuration for Hasura-like APIs |
| `persistState` | `boolean` | `false` | Enable state persistence for this table (Coming soon) |
| `persistKey` | `string` | `''` | Unique key for state persistence (Coming soon) |

## Events

The `ArpixDataTable` component emits the following events:

| Event | Parameters | Description |
|-------|------------|-------------|
| `update:loading` | `boolean` | Emitted when the loading state changes |
| `update:error` | `string` | Emitted when the error state changes |
| `page-change` | `number` | Emitted when the page changes |
| `sort-change` | `SortConfig` | Emitted when the sort changes |
| `search-change` | `string` | Emitted when the search query changes |
| `filter-change` | `FilterSet` | Emitted when the filters change |
| `selection-change` | `any[]` | Emitted when the selection changes |
| `row-click` | `(row: any, index: number)` | Emitted when a row is clicked |
| `cell-click` | `(value: any, key: string, row: any)` | Emitted when a cell is clicked |

## Slots

The `ArpixDataTable` component provides the following slots:

| Slot | Props | Description |
|------|-------|-------------|
| `header` | - | Custom header content |
| `footer` | - | Custom footer content |
| `empty` | - | Custom empty state content |
| `loading` | - | Custom loading state content |
| `error` | `{ error: string }` | Custom error state content |
| `cell(key)` | `{ value: any, row: any, index: number }` | Custom cell content for the specified key |
| `header-cell(key)` | `{ column: TableColumn }` | Custom header cell content for the specified key |

Example:

```vue
<template>
  <ArpixDataTable :columns="columns" :data-source="data">
    <!-- Custom header -->
    <template #header>
      <div class="custom-header">
        <h2>My Table</h2>
        <button>Add New</button>
      </div>
    </template>

    <!-- Custom cell content for the 'actions' column -->
    <template #cell(actions)="{ row }">
      <button @click="editItem(row)">Edit</button>
      <button @click="deleteItem(row)">Delete</button>
    </template>

    <!-- Custom empty state -->
    <template #empty>
      <div class="custom-empty-state">
        <p>No data found. Would you like to create a new item?</p>
        <button>Create New</button>
      </div>
    </template>
  </ArpixDataTable>
</template>
```

## Methods

The `ArpixDataTable` component provides the following methods:

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `refresh` | - | `Promise<void>` | Refresh the data |
| `exportData` | `format: 'csv' \| 'excel' \| 'pdf', options?: ExportOptions, data?: any[]` | `Promise<{ success: boolean; format: string; fileName: string }>` | Export data |
| `setPage` | `page: number` | `void` | Set the current page |
| `setPageSize` | `size: number` | `void` | Set the page size |
| `setSort` | `sort: SortConfig` | `void` | Set the sort configuration |
| `setSearch` | `query: string` | `void` | Set the search query |
| `setFilters` | `filters: FilterSet` | `void` | Set the filters |
| `clearFilters` | - | `void` | Clear all filters |
| `selectAll` | - | `void` | Select all rows |
| `clearSelection` | - | `void` | Clear the selection |
| `toggleSelection` | `row: any` | `void` | Toggle the selection of a row |

Example:

```vue
<template>
  <div>
    <ArpixDataTable
      ref="dataTable"
      :columns="columns"
      :data-source="data"
    />
    <div class="table-actions">
      <button @click="refreshData">Refresh</button>
      <button @click="exportToCsv">Export to CSV</button>
      <button @click="clearAllFilters">Clear Filters</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const dataTable = ref(null)

const refreshData = () => {
  if (dataTable.value) {
    dataTable.value.refresh()
  }
}

const exportToCsv = () => {
  if (dataTable.value) {
    dataTable.value.exportData('csv', { fileName: 'my-data' })
  }
}

const clearAllFilters = () => {
  if (dataTable.value) {
    dataTable.value.clearFilters()
  }
}
</script>
```

## Type Definitions

### TableColumn

```ts
interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'relation' | 'custom';
  format?: Function | string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  visible?: boolean;
  class?: string;
  enumValues?: string[];
  statusColors?: Record<string, { background?: string; text?: string; border?: string; }>;
  relation?: {
    table: string;
    displayField: string;
    foreignKey: string;
    apiEndpoint?: string;
    applyImmediately?: boolean;
  };
}
```

### SortConfig

```ts
interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}
```

### FilterConfig

```ts
interface FilterConfig {
  field: string;
  operator: string;
  value: any;
}
```

### FilterSet

```ts
type FilterSet = Record<string, FilterConfig>;
```

### RelationConfig

```ts
interface RelationConfig {
  table: string;
  fields: string[];
}
```

### ExportOptions

```ts
interface ExportOptions {
  fileName?: string;
  columns?: TableColumn[];
  items?: Record<string, any>[];
  applyFilters?: boolean;
  applySearch?: boolean;
  csv?: {
    delimiter?: string;
    includeHeaders?: boolean;
  };
  excel?: {
    sheetName?: string;
    styleHeaders?: boolean;
    autoSize?: boolean;
  };
  pdf?: {
    orientation?: 'portrait' | 'landscape';
    unit?: string;
    format?: string | [number, number];
    title?: string;
    includeDate?: boolean;
  };
}
```
