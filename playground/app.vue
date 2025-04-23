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
        <template #cell(actions)="{ row }">
          <div class="action-buttons">
            <button class="action-button edit" @click="handleEdit(row)" title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="action-button delete" @click="handleDelete(row)" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </template>
        <template #footer>
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
        </template>
      </ArpixDataTable>
    </div>
    <div class="example-section">
      <h2 class="section-title">Custom Cell Rendering Example</h2>
      <ArpixDataTable
        :columns="customRenderColumns"
        :data-source="customRenderData"
      >
        <!-- Custom cell rendering for the progress column using the ProgressBar component -->
        <template #cell(progress)="{ value }">
          <ProgressBar :value="value" :show-label="true" suffix="%" :color="getProgressColor(value)" />
        </template>

        <!-- Custom cell rendering for the tags column using the TagsList component -->
        <template #cell(tags)="{ value }">
          <TagsList
            :tags="value"
            :color-map="tagColors"
            :clickable="true"
            @tag-click="handleTagClick"
          />
        </template>
      </ArpixDataTable>
    </div>

    <!-- New example section to demonstrate the components directly -->
    <div class="example-section">
      <h2 class="section-title">Hasura-like API Example with Relations</h2>
      <ArpixDataTable
        :columns="hasuraColumns"
        data-source="/api/playground/data"
        pagination="server"
        :per-page="10"
        :relations="hasuraRelations"
      />
      <div class="debug-info">
        <p>This example uses a custom endpoint that simulates a Hasura GraphQL API response with relation data.</p>
        <p>The endpoint is at <code>/api/playground/data</code> and returns employee data with department and project relations.</p>
      </div>
    </div>

    <div class="example-section">
      <h2 class="section-title">Reusable Components Example</h2>

      <div class="component-demo">
        <h3>ProgressBar Component</h3>
        <div class="demo-row">
          <ProgressBar :value="25" :show-label="true" suffix="%" />
          <ProgressBar :value="50" :show-label="true" suffix="%" />
          <ProgressBar :value="75" :show-label="true" suffix="%" />
          <ProgressBar :value="90" :show-label="true" suffix="%" />
          <ProgressBar :value="60" :show-label="true" suffix="%" color="#8b5cf6" />
        </div>

        <h3>TagsList Component</h3>
        <div class="demo-row">
          <TagsList
            :tags="['Frontend', 'Backend', 'UI', 'API', 'Mobile', 'Database']"
            :color-map="tagColors"
            :clickable="true"
            @tag-click="handleTagClick"
          />
        </div>
      </div>
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
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    filterable: true,
    enumValues: ['Active', 'Inactive', 'Pending'],
    type: 'custom',
    format: 'status-format',
    statusColors: {
      'Active': { background: '#dcfce7', text: '#166534', border: '#166534' },
      'Inactive': { background: '#f3f4f6', text: '#4b5563', border: '#4b5563' },
      'Pending': { background: '#fef9c3', text: '#854d0e', border: '#854d0e' }
    }
  },
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
  { key: 'id', label: 'ID', sortable: true, width: '110px', filterable: true, type: 'number', visible: false },
  { key: 'name', label: 'Name', sortable: true, filterable: true },
  { key: 'active', label: 'Active', sortable: true, filterable: true, type: 'boolean', format: 'boolean-format', align: 'center' },
  { key: 'verified', label: 'Verified', sortable: true, filterable: true, type: 'boolean' },
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
  { key: 'id', label: 'ID', sortable: true, width: '110px', filterable: true, type: 'number', visible: false },
  { key: 'name', label: 'Name', sortable: true, filterable: true },
  { key: 'description', label: 'Description', filterable: true },
  { key: 'date', label: 'Date', sortable: true, type: 'date', filterable: true },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    filterable: true,
    enumValues: ['active', 'inactive'],
    type: 'custom',
    format: 'status-format',
    statusColors: {
      active: { background: '#dbeafe', text: '#1e40af', border: '#1e40af' },
      inactive: { background: '#e5e7eb', text: '#4b5563', border: '#4b5563' },
    },
  },
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
    statusColors: {
      completed: { background: '#dcfce7', text: '#166534', border: '#166534' },
      pending: { background: '#fef9c3', text: '#854d0e', border: '#854d0e' },
      cancelled: { background: '#fee2e2', text: '#991b1b', border: '#991b1b' },
    },
  },
  {
    key: 'isActive',
    label: 'Active',
    type: 'boolean',
    filterable: false,
    // Format function will be applied on client-side only
    format: 'boolean-format',
    align: 'center',
  },
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
    filterable: false,
    width: '150px',
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

// Custom cell action handlers
const handleEdit = (row: any) => {
  console.log('Edit item:', row)
  // In a real application, you might open a modal or navigate to an edit page
  alert(`Editing item: ${row.name}`)
}

const handleDelete = (row: any) => {
  console.log('Delete item:', row)
  // In a real application, you might show a confirmation dialog
  alert(`Deleting item: ${row.name}`)
}

// Custom rendering example
const customRenderColumns: TableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px' },
  { key: 'name', label: 'Project', sortable: true },
  { key: 'progress', label: 'Progress', sortable: true, type: 'number' },
  { key: 'tags', label: 'Tags' },
  { key: 'lastUpdate', label: 'Last Update', sortable: true, type: 'date', format: 'date-format' }
]

const customRenderData = [
  { id: 1, name: 'Website Redesign', progress: 75, tags: ['UI', 'Design', 'Frontend', 'SQL'], lastUpdate: '2023-06-15' },
  { id: 2, name: 'Mobile App Development', progress: 45, tags: ['React Native', 'Mobile'], lastUpdate: '2023-07-22' },
  { id: 3, name: 'API Integration', progress: 90, tags: ['Backend', 'API'], lastUpdate: '2023-08-05' },
  { id: 4, name: 'Database Migration', progress: 30, tags: ['Database', 'SQL'], lastUpdate: '2023-09-10' },
  { id: 5, name: 'Security Audit', progress: 60, tags: ['Security', 'Testing'], lastUpdate: '2023-10-18' }
]

const getProgressColor = (value: number): string => {
  if (value < 40) return 'var(--arpix-error-color, #ef4444)'; // Red for low progress
  if (value < 70) return 'var(--arpix-warning-color, #f59e0b)'; // Amber for medium progress
  return 'var(--arpix-success-color, #10b981)'; // Green for high progress
};

// Tag colors for the TagsList component
const tagColors: Record<string, string> = {
  UI: '#e0f2fe',
  Design: '#dbeafe',
  Frontend: '#ede9fe',
  Backend: '#f3e8ff',
  API: '#fae8ff',
  Mobile: '#fce7f3',
  Database: '#fef3c7',
  SQL: '#ecfccb',
  Security: '#ffedd5',
  Testing: '#f3f4f6',
  'React Native': '#fce7f3',
}

// Handle tag click event
const handleTagClick = (tag: string) => {
  console.log(`Tag clicked: ${tag}`)
  alert(`Tag clicked: ${tag}`)
}

// Hasura-like API example with relations
const hasuraRelations = [
  { name: 'department', target: 'departments', type: 'belongsTo' },
  { name: 'project', target: 'projects', type: 'belongsTo' }
]

const hasuraColumns: TableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px', filterable: true, type: 'number' },
  { key: 'first_name', label: 'First Name', sortable: true, filterable: true },
  { key: 'last_name', label: 'Last Name', sortable: true, filterable: true },
  { key: 'email', label: 'Email', sortable: true, filterable: true },
  { key: 'hire_date', label: 'Hire Date', sortable: true, type: 'date', filterable: true, format: 'date-format' },
  { key: 'salary', label: 'Salary', sortable: true, type: 'number', filterable: true, format: 'currency-format', align: 'right' },
  {
    key: 'is_active',
    label: 'Active',
    sortable: true,
    filterable: true,
    type: 'boolean',
    format: 'boolean-format',
    align: 'center'
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    filterable: true,
    enumValues: ['active', 'on_leave', 'terminated'],
    type: 'custom',
    format: 'status-format',
    statusColors: {
      active: { background: '#dcfce7', text: '#166534', border: '#166534' },
      on_leave: { background: '#fef9c3', text: '#854d0e', border: '#854d0e' },
      terminated: { background: '#fee2e2', text: '#991b1b', border: '#991b1b' }
    }
  },
  {
    key: 'department_id',
    label: 'Department',
    sortable: true,
    filterable: true,
    type: 'relation',
    relation: {
      table: 'department', // Cambiado a singular para coincidir con la respuesta del API
      displayField: 'name',
      foreignKey: 'department_id',
      apiEndpoint: '/api/playground/relation-options',
      applyImmediately: false // Cambiado a false para usar el botón Apply
    }
  },
  {
    key: 'project_id',
    label: 'Project',
    sortable: true,
    filterable: true,
    type: 'relation',
    relation: {
      table: 'project', // Changed to singular to match API response
      displayField: 'name',
      foreignKey: 'project_id',
      apiEndpoint: '/api/playground/relation-options',
      applyImmediately: false // Changed to false to use Apply button
    }
  }
]
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
/* .status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
} */

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
  width: 100% !important;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  /* background-color: #f8fafc;
  border-top: 1px solid #e2e8f0; */
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

/* Custom action buttons styles */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  background-color: white;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  background-color: #f1f5f9;
}

.action-button.edit:hover {
  color: #3b82f6;
  border-color: #3b82f6;
}

.action-button.delete:hover {
  color: #ef4444;
  border-color: #ef4444;
}

/* Demo section styles */
.component-demo {
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1rem;
}

.component-demo h3 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: #374151;
}

.demo-row {
  margin-bottom: 2rem;
}

.demo-row:last-child {
  margin-bottom: 0;
}
</style>
