# Filtering System

The nuxt-arpix-data-table module provides a powerful filtering system that supports different column types and operators.

## Enabling Filtering

To enable filtering for a column, set the `filterable` property to `true`:

```js
{
  key: 'name',
  label: 'Name',
  filterable: true
}
```

## Filter Types

The filtering system adapts to the column type:

### Text Filters

For text columns, the following operators are available:
- Contains
- Equals
- Starts with
- Ends with

```js
{
  key: 'name',
  label: 'Name',
  type: 'text', // Default
  filterable: true
}
```

### Number Filters

For number columns, the following operators are available:
- Equals
- Not equals
- Greater than
- Greater than or equal
- Less than
- Less than or equal

```js
{
  key: 'price',
  label: 'Price',
  type: 'number',
  filterable: true
}
```

### Date Filters

For date columns, the following operators are available:
- After
- Before
- Between

```js
{
  key: 'created_at',
  label: 'Created',
  type: 'date',
  filterable: true
}
```

### Boolean Filters

For boolean columns, a simple true/false selection is provided:

```js
{
  key: 'active',
  label: 'Active',
  type: 'boolean',
  filterable: true
}
```

### Enum/Status Filters

For columns with predefined values, a dropdown selection is provided:

```js
{
  key: 'status',
  label: 'Status',
  type: 'custom',
  format: 'status-format',
  filterable: true,
  enumValues: ['Active', 'Inactive', 'Pending']
}
```

### Relation Filters

For relation columns, a dropdown with options from the related table is provided:

```js
{
  key: 'department_id',
  label: 'Department',
  type: 'relation',
  filterable: true,
  relation: {
    table: 'department',
    displayField: 'name',
    foreignKey: 'department_id',
    apiEndpoint: '/api/departments/options',
    applyImmediately: false // Use Apply button instead of immediate filtering
  }
}
```

## Filter UI

The filter UI appears when clicking the filter icon next to the column header. The filter window is positioned intelligently:
- Centered below the filter button
- Adjusts direction based on screen edge proximity
- Only one filter window is open at a time
- Closes when the Escape key is pressed

## Active Filters

Active filters are displayed as tags above the table. Each tag shows:
- The column name
- The filter operator
- The filter value

For relation fields, the tag displays the relation name instead of just the ID.

Filter tags can be closed by clicking anywhere on the tag, not just on the X icon.

## Filter Persistence (Coming Soon)

The filtering state will soon be able to be saved in cookies, allowing users to return to the same view when they revisit the page:

```ts
// nuxt.config.ts (Coming soon)
export default defineNuxtConfig({
  modules: ['nuxt-arpix-data-table'],
  arpixDataTable: {
    // ... other options
    statePersistence: {
      enabled: true,
      cookiePrefix: 'my-app-dt',
      persist: ['filters'] // Include 'filters' to persist filter state
    }
  }
})
```

> Note: This feature is currently under development and will be available in a future release.

## Initial Filters

You can set initial filters for the table:

```vue
<template>
  <ArpixDataTable
    :columns="columns"
    :data-source="data"
    :initial-filters="{
      status: { field: 'status', operator: '=', value: 'Active' }
    }"
  />
</template>
```

## Filter Events

The data table emits a `filter-change` event when filters are changed:

```vue
<template>
  <ArpixDataTable
    :columns="columns"
    :data-source="data"
    @filter-change="onFilterChange"
  />
</template>

<script setup>
const onFilterChange = (filters) => {
  console.log('Filters changed:', filters)
}
</script>
```

## Server-side Filtering

For server-side filtering, the data table sends the filter parameters to the API endpoint:

```vue
<template>
  <ArpixDataTable
    :columns="columns"
    data-source="/api/users"
    pagination="server"
  />
</template>
```

The API endpoint will receive the following parameters:
- `filters`: JSON string of the filter configuration
- `page`: Current page number
- `perPage`: Items per page
- `sort`: Sort configuration (if any)
- `search`: Search query (if any)

Example API request:
```
GET /api/users?page=1&perPage=10&filters={"name":{"field":"name","operator":"contains","value":"john"}}&sort={"field":"name","direction":"asc"}&search=
```
