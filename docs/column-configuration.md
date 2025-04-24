# Column Configuration

The `columns` prop is an array of column configuration objects that define how each column in the data table behaves and appears.

## Basic Column Properties

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
| `class` | `String` | - | CSS class to apply to the column |

## Basic Example

```vue
<script setup>
const columns = [
  { key: 'id', label: 'ID', sortable: true, width: '80px', align: 'center' },
  { key: 'name', label: 'Name', sortable: true, filterable: true },
  { key: 'email', label: 'Email', sortable: true, filterable: true },
  { key: 'created_at', label: 'Created', type: 'date', sortable: true, filterable: true }
]
</script>
```

## Column Types

### Text Columns

Text columns are the default type and support string operations like contains, equals, starts with, and ends with.

```js
{
  key: 'name',
  label: 'Name',
  type: 'text', // Default, can be omitted
  sortable: true,
  filterable: true
}
```

### Number Columns

Number columns support numeric operations like equals, greater than, less than, etc.

```js
{
  key: 'price',
  label: 'Price',
  type: 'number',
  sortable: true,
  filterable: true,
  align: 'right', // Right-align numbers
  format: (value) => `$${value.toFixed(2)}` // Custom formatter
}
```

### Date Columns

Date columns support date operations like after, before, and between.

```js
{
  key: 'created_at',
  label: 'Created',
  type: 'date',
  sortable: true,
  filterable: true,
  format: 'date-format' // Use built-in date formatter
}
```

### Boolean Columns

Boolean columns display and filter true/false values.

```js
{
  key: 'active',
  label: 'Active',
  type: 'boolean',
  sortable: true,
  filterable: true,
  format: 'boolean-format' // Use built-in boolean formatter
}
```

### Relation Columns

Relation columns handle foreign key relationships and display related data.

```js
{
  key: 'department_id',
  label: 'Department',
  type: 'relation',
  sortable: true,
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

### Custom Columns

Custom columns can use predefined formatters or custom rendering.

```js
{
  key: 'status',
  label: 'Status',
  type: 'custom',
  sortable: true,
  filterable: true,
  format: 'status-format', // Use built-in status formatter
  enumValues: ['Active', 'Inactive', 'Pending'],
  statusColors: {
    'Active': { background: '#dcfce7', text: '#166534', border: '#166534' },
    'Inactive': { background: '#f3f4f6', text: '#4b5563', border: '#4b5563' },
    'Pending': { background: '#fef9c3', text: '#854d0e', border: '#854d0e' }
  }
}
```

## Predefined Formatters

The data table includes several predefined formatters that you can use by specifying the `format` property:

### Status Format

Displays a status badge with customizable colors.

```js
{
  key: 'status',
  label: 'Status',
  type: 'custom',
  format: 'status-format',
  enumValues: ['Active', 'Inactive', 'Pending'],
  statusColors: {
    'Active': { background: '#dcfce7', text: '#166534', border: '#166534' },
    'Inactive': { background: '#f3f4f6', text: '#4b5563', border: '#4b5563' },
    'Pending': { background: '#fef9c3', text: '#854d0e', border: '#854d0e' }
  }
}
```

### Boolean Format

Displays boolean values with customizable icons and text.

```js
{
  key: 'active',
  label: 'Active',
  type: 'boolean',
  format: 'boolean-format'
}
```

### Date Format

Formats date values using date-fns.

```js
{
  key: 'created_at',
  label: 'Created',
  type: 'date',
  format: 'date-format'
}
```

### Currency Format

Formats number values as currency.

```js
{
  key: 'price',
  label: 'Price',
  type: 'number',
  format: 'currency-format',
  align: 'right'
}
```

## Custom Formatters

You can also provide your own formatter function:

```js
{
  key: 'score',
  label: 'Score',
  format: (value, row) => {
    if (value >= 90) return `<span class="text-green-600">${value}</span>`
    if (value >= 70) return `<span class="text-yellow-600">${value}</span>`
    return `<span class="text-red-600">${value}</span>`
  }
}
```

## Using Slots for Custom Rendering

For more complex rendering, you can use slots:

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

## Column Width and Alignment

You can control the width and text alignment of columns:

```js
{
  key: 'id',
  label: 'ID',
  width: '80px', // Fixed width
  align: 'center' // Center alignment
}
```

The data table respects the width property when it's explicitly set. Columns without a specified width will have a minimum width of 180px.

## Text Alignment

You can set the text alignment for each column:

```js
{
  key: 'name',
  label: 'Name',
  align: 'left' // Default
}

{
  key: 'price',
  label: 'Price',
  align: 'right' // Right-aligned
}

{
  key: 'status',
  label: 'Status',
  align: 'center' // Center-aligned
}
```
