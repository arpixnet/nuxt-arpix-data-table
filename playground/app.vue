<template>
  <div class="container">
    <h1 class="page-title">Arpix Data Table Demo</h1>

    <div class="example-section">
      <h2 class="section-title">Basic Example</h2>
      <ArpixDataTable
        :columns="basicColumns"
        :data-source="basicData"
        table-class="basic-table"
      />
      <div class="debug-info">
        <p>Basic Data: {{ basicData.length }} items</p>
      </div>
    </div>

    <div class="example-section">
      <h2 class="section-title">Server-side Example</h2>
      <ArpixDataTable
        :columns="serverColumns"
        data-source="/api/arpix-data-table/data"
        pagination="server"
        :per-page="5"
        theme="dark"
      />
    </div>

    <div class="example-section">
      <h2 class="section-title">Advanced Example with Formatters</h2>
      <ArpixDataTable
        :columns="advancedColumns"
        :data-source="advancedData"
        :selectable="true"
        @selection-change="onSelectionChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { TableColumn } from '../src/runtime/types'

// Basic example data
const basicColumns: TableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px', filterable: true },
  { key: 'name', label: 'Name', sortable: true, filterable: true },
  { key: 'email', label: 'Email', sortable: true, filterable: true },
  { key: 'status', label: 'Status', sortable: true, filterable: true }
]

const basicData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Active' },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', status: 'Pending' },
  { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', status: 'Active' }
]

// Server-side example columns
const serverColumns: TableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px', filterable: true },
  { key: 'name', label: 'Name', sortable: true, filterable: true },
  { key: 'description', label: 'Description', filterable: true },
  { key: 'date', label: 'Date', sortable: true, type: 'date', filterable: true },
  { key: 'status', label: 'Status', sortable: true, filterable: true },
  { key: 'price', label: 'Price', sortable: true, type: 'number', filterable: true }
]

// Advanced example with formatters
const advancedColumns: TableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px', filterable: true },
  { key: 'name', label: 'Name', sortable: true, filterable: true },
  {
    key: 'date',
    label: 'Date',
    sortable: true,
    type: 'date',
    filterable: true,
    format: (value) => new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  },
  {
    key: 'amount',
    label: 'Amount',
    sortable: true,
    type: 'number',
    filterable: true,
    format: (value) => `$${value.toFixed(2)}`
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    filterable: true,
    format: (value: string, _row) => {
      const statusClasses: Record<string, string> = {
        completed: 'status-completed',
        pending: 'status-pending',
        cancelled: 'status-cancelled'
      }

      return `<span class="status-badge ${statusClasses[value] || ''}">${value}</span>`
    }
  },
  {
    key: 'isActive',
    label: 'Active',
    type: 'boolean',
    filterable: true,
    format: (value: boolean) => {
      return value
        ? '<span class="status-active">✓</span>'
        : '<span class="status-inactive">✗</span>'
    }
  }
]

const advancedData = [
  {
    id: 1,
    name: 'Project Alpha',
    date: '2023-01-15',
    amount: 1250.99,
    status: 'completed',
    isActive: true
  },
  {
    id: 2,
    name: 'Project Beta',
    date: '2023-02-28',
    amount: 2340.50,
    status: 'pending',
    isActive: true
  },
  {
    id: 3,
    name: 'Project Gamma',
    date: '2023-03-10',
    amount: 890.25,
    status: 'cancelled',
    isActive: false
  },
  {
    id: 4,
    name: 'Project Delta',
    date: '2023-04-05',
    amount: 1675.75,
    status: 'completed',
    isActive: true
  },
  {
    id: 5,
    name: 'Project Epsilon',
    date: '2023-05-20',
    amount: 3420.00,
    status: 'pending',
    isActive: true
  }
]

// Event handlers
const onSelectionChange = (selected: any[]) => {
  console.log('Selected items:', selected)
}
</script>

<style>
/* Base styles for the playground */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f9f9f9;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-title {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #333;
}

.example-section {
  margin-bottom: 3rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #444;
}

/* Custom styles for the basic table */
.basic-table {
  --arpix-primary-color: #4f46e5;
  --arpix-border-color: #e5e7eb;
  --arpix-header-background: #f3f4f6;
}

/* Debug info styles */
.debug-info {
  margin-top: 1rem;
  padding: 0.5rem;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  color: #6c757d;
}

/* Status badge styles */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-completed {
  background-color: #d1fae5;
  color: #065f46;
}

.status-pending {
  background-color: #fef3c7;
  color: #92400e;
}

.status-cancelled {
  background-color: #fee2e2;
  color: #b91c1c;
}

.status-active {
  color: #16a34a;
}

.status-inactive {
  color: #dc2626;
}
</style>
