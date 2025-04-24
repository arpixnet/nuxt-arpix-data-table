# Data Export

The nuxt-arpix-data-table module provides built-in functionality to export data in various formats:
- CSV
- Excel
- PDF

## Basic Usage

To use the export functionality, you need to access the data table component using a ref:

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
      fileName: 'my-data-export'
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
      fileName: 'my-data-export'
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
      fileName: 'my-data-export'
    })
    console.log('Export successful:', result)
  } catch (error) {
    console.error('Export failed:', error)
  }
}
</script>
```

## Export Options

The `exportData` method accepts the following parameters:

```ts
exportData(
  format: 'csv' | 'excel' | 'pdf',
  options?: ExportOptions,
  data?: Record<string, any>[]
): Promise<{ success: boolean; format: string; fileName: string }>
```

### Common Options

These options apply to all export formats:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fileName` | `string` | `export_YYYY-MM-DD` | File name for the exported file (without extension) |
| `columns` | `TableColumn[]` | All columns | Columns to include in the export |
| `items` | `Record<string, any>[]` | Current table items | Items to export |
| `applyFilters` | `boolean` | `true` | Whether to apply current filters |
| `applySearch` | `boolean` | `true` | Whether to apply current search |

### CSV Options

These options apply only to CSV export:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `csv.delimiter` | `string` | `,` | Delimiter character |
| `csv.includeHeaders` | `boolean` | `true` | Whether to include headers |

Example:

```js
const result = await dataTable.value.exportData('csv', {
  fileName: 'users-export',
  csv: {
    delimiter: ';',
    includeHeaders: true
  }
})
```

### Excel Options

These options apply only to Excel export:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `excel.sheetName` | `string` | `'Data'` | Sheet name |
| `excel.styleHeaders` | `boolean` | `true` | Whether to style headers |
| `excel.autoSize` | `boolean` | `true` | Whether to auto-size columns |

Example:

```js
const result = await dataTable.value.exportData('excel', {
  fileName: 'users-export',
  excel: {
    sheetName: 'Users',
    styleHeaders: true,
    autoSize: true
  }
})
```

### PDF Options

These options apply only to PDF export:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pdf.orientation` | `'portrait' \| 'landscape'` | `'portrait'` | Page orientation |
| `pdf.unit` | `string` | `'mm'` | Page unit |
| `pdf.format` | `string \| [number, number]` | `'a4'` | Page format |
| `pdf.title` | `string` | `'Data Export'` | Document title |
| `pdf.includeDate` | `boolean` | `true` | Whether to include date |

Example:

```js
const result = await dataTable.value.exportData('pdf', {
  fileName: 'users-export',
  pdf: {
    orientation: 'landscape',
    title: 'Users Report',
    includeDate: true
  }
})
```

## Dependencies

The export functionality requires additional libraries:

- Excel export requires the `exceljs` library
- PDF export requires the `jspdf` library
- For better PDF tables, you can also install `jspdf-autotable`

Install these dependencies:

```bash
npm install exceljs jspdf jspdf-autotable
# or
yarn add exceljs jspdf jspdf-autotable
```

## Export with Filtering and Sorting

The export functionality respects the current filtering, search, and sorting settings:

```js
const exportFilteredData = async () => {
  if (!dataTable.value) return
  
  try {
    const result = await dataTable.value.exportData('csv', {
      fileName: 'filtered-data',
      // Apply current filters and search
      applyFilters: true,
      applySearch: true
    })
    console.log('Export successful:', result)
  } catch (error) {
    console.error('Export failed:', error)
  }
}
```

## Custom Data Export

You can also export custom data by providing the `data` parameter:

```js
const exportCustomData = async () => {
  if (!dataTable.value) return
  
  const customData = [
    { id: 1, name: 'Custom Item 1' },
    { id: 2, name: 'Custom Item 2' }
  ]
  
  try {
    const result = await dataTable.value.exportData('csv', {
      fileName: 'custom-data'
    }, customData)
    console.log('Export successful:', result)
  } catch (error) {
    console.error('Export failed:', error)
  }
}
```
