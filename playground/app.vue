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
      <h2 class="section-title">Alphanumeric IDs Example</h2>
      <ArpixDataTable
        :columns="alphaIdColumns"
        :data-source="alphaIdData"
      />
      <div class="debug-info">
        <p>Alphanumeric IDs: {{ alphaIdData.length }} items</p>
      </div>
    </div>

    <div class="example-section">
      <h2 class="section-title">Boolean Filter Example</h2>
      <ArpixDataTable
        :columns="booleanColumns"
        :data-source="booleanData"
      />
      <div class="debug-info">
        <p>Boolean Data: {{ booleanData.length }} items</p>
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
        density="compact"
      >
        <template #footer>
          <tr>
            <td :colspan="advancedColumns.length + 1">
              <div class="custom-footer">
                <div class="footer-summary">
                  <span>Total Items: {{ advancedData.length }}</span>
                  <span>Total Amount: ${{ calculateTotalAmount(advancedData).toFixed(2) }}</span>
                </div>
                <div class="footer-actions">
                  <button class="footer-button">Export Data</button>
                  <button class="footer-button primary">Add New Item</button>
                </div>
              </div>
            </td>
          </tr>
        </template>
      </ArpixDataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '../src/runtime/types'

// Basic example data
const basicColumns: TableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '110px', filterable: true },
  { key: 'name', label: 'Name', sortable: true, filterable: true },
  { key: 'email', label: 'Email', sortable: true, filterable: true },
  { key: 'status', label: 'Status', sortable: true, filterable: true, enumValues: ['Active', 'Inactive', 'Pending'], type: 'custom' },
]

const basicData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Active' },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', status: 'Pending' },
  { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', status: 'Active' },
]

// Alphanumeric IDs example
const alphaIdColumns: TableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '110px', filterable: true },
  { key: 'name', label: 'Name', sortable: true, filterable: true },
  { key: 'category', label: 'Category', sortable: true, filterable: true },
  { key: 'status', label: 'Status', sortable: true, filterable: true, enumValues: ['Active', 'Inactive'], type: 'custom' },
]

const alphaIdData = [
  { id: 'A001', name: 'Product Alpha', category: 'Electronics', status: 'Active' },
  { id: 'B002', name: 'Product Beta', category: 'Furniture', status: 'Active' },
  { id: 'C003', name: 'Product Gamma', category: 'Clothing', status: 'Inactive' },
  { id: 'D004', name: 'Product Delta', category: 'Electronics', status: 'Active' },
  { id: '1005', name: 'Product Epsilon', category: 'Furniture', status: 'Inactive' },
]

// Boolean filter example
const booleanColumns: TableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '110px', filterable: true, type: 'number' },
  { key: 'name', label: 'Name', sortable: true, filterable: true },
  { key: 'active', label: 'Active', sortable: true, filterable: true, type: 'boolean' },
  { key: 'verified', label: 'Verified', sortable: true, filterable: true, type: 'boolean' }
]

const booleanData = [
  { id: 1, name: 'User One', active: true, verified: true },
  { id: 2, name: 'User Two', active: true, verified: false },
  { id: 3, name: 'User Three', active: false, verified: true },
  { id: 4, name: 'User Four', active: false, verified: false },
  { id: 5, name: 'User Five', active: true, verified: true }
]

// Server-side example columns
const serverColumns: TableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '110px', filterable: true, type: 'number' },
  { key: 'name', label: 'Name', sortable: true, filterable: true },
  { key: 'description', label: 'Description', filterable: true },
  { key: 'date', label: 'Date', sortable: true, type: 'date', filterable: true },
  { key: 'status', label: 'Status', sortable: true, filterable: true, enumValues: ['active', 'inactive'], type: 'custom' },
  { key: 'price', label: 'Price', sortable: true, type: 'number', filterable: true },
]

// Advanced example with formatters
const advancedColumns: TableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '110px', filterable: true, type: 'number' },
  { key: 'name', label: 'Name', sortable: true, filterable: true },
  {
    key: 'date',
    label: 'Date',
    sortable: true,
    type: 'date',
    filterable: true,
    // Format function will be applied on client-side only
    format: 'date-format',
  },
  {
    key: 'amount',
    label: 'Amount',
    sortable: true,
    type: 'number',
    filterable: true,
    // Format function will be applied on client-side only
    format: 'currency-format',
    align: 'right',
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    filterable: true,
    // Format function will be applied on client-side only
    format: 'status-format',
    type: 'custom',
    enumValues: ['completed', 'pending', 'cancelled'],
  },
  {
    key: 'isActive',
    label: 'Active',
    type: 'boolean',
    filterable: true,
    // Format function will be applied on client-side only
    format: 'boolean-format',
    align: 'center',
  },
]

const advancedData = [
  {
    id: 1,
    name: 'Project Alpha',
    date: '2023-01-15',
    amount: 1250.99,
    status: 'completed',
    isActive: true,
  },
  {
    id: 2,
    name: 'Project Beta',
    date: '2023-02-28',
    amount: 2340.50,
    status: 'pending',
    isActive: true,
  },
  {
    id: 3,
    name: 'Project Gamma',
    date: '2023-03-10',
    amount: 890.25,
    status: 'cancelled',
    isActive: false,
  },
  {
    id: 4,
    name: 'Project Delta',
    date: '2023-04-05',
    amount: 1675.75,
    status: 'completed',
    isActive: true,
  },
  {
    id: 5,
    name: 'Project Epsilon',
    date: '2023-05-20',
    amount: 3420.00,
    status: 'pending',
    isActive: true,
  },
]

// Event handlers
const onSelectionChange = (selected: any[]) => {
  console.log('Selected items:', selected)
}

// Calculate total amount for the footer
const calculateTotalAmount = (items: any[]): number => {
  return items.reduce((total, item) => total + (item.amount || 0), 0)
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
  --arpix-header-background: #d9dd00;
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

/* Custom footer styles */
.custom-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.footer-summary {
  display: flex;
  gap: 1.5rem;
}

.footer-summary span {
  font-weight: 500;
  color: #334155;
}

.footer-actions {
  display: flex;
  gap: 0.75rem;
}

.footer-button {
  padding: 0.5rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.375rem;
  background-color: white;
  color: #334155;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.footer-button:hover {
  background-color: #f1f5f9;
}

.footer-button.primary {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.footer-button.primary:hover {
  background-color: #2563eb;
  border-color: #2563eb;
}
</style>
