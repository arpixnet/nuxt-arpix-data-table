# Theming

The nuxt-arpix-data-table module provides a flexible theming system using CSS variables.

## Built-in Themes

The module includes two built-in themes:
- `default` - Light theme
- `dark` - Dark theme

You can set the theme at the module level:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-arpix-data-table'],
  arpixDataTable: {
    theme: 'dark' // 'default' or 'dark'
  }
})
```

Or at the component level:

```vue
<template>
  <ArpixDataTable
    :columns="columns"
    :data-source="data"
    theme="dark"
  />
</template>
```

## CSS Variables

The module uses CSS variables for theming. You can customize these variables to match your application's design.

### Table Variables

```css
:root {
  /* Base colors */
  --arpix-primary-color: #3b82f6;
  --arpix-secondary-color: #64748b;
  --arpix-success-color: #10b981;
  --arpix-warning-color: #f59e0b;
  --arpix-error-color: #ef4444;

  /* Light theme */
  --arpix-background-color: #ffffff;
  --arpix-text-color: #1e293b;
  --arpix-border-color: #e2e8f0;
  --arpix-header-background: #f1f5f9;
  --arpix-header-text-color: #334155;
  --arpix-hover-color: #f8fafc;
  --arpix-row-selected: #eff6ff;

  /* Dark theme */
  --arpix-background-color: #1e293b;
  --arpix-text-color: #f1f5f9;
  --arpix-border-color: #334155;
  --arpix-header-background: #0f172a;
  --arpix-header-text-color: #e2e8f0;
  --arpix-hover-color: #334155;
  --arpix-row-selected: #1e3a8a;

  /* Form elements */
  --arpix-input-bg: #f9fafb;
  --arpix-input-border: #d1d5db;
  --arpix-input-text: #1f2937;
  --arpix-input-bg-dark: #374151;
  --arpix-input-border-dark: #4b5563;
  --arpix-input-text-dark: #f9fafb;
}
```

### Component-specific Variables

#### ProgressBar Variables

```css
:root {
  --arpix-progress-bg: #f3f4f6;
  --arpix-progress-text: #1f2937;
  --arpix-progress-bg-dark: #374151;
  --arpix-progress-text-dark: #f9fafb;
}
```

#### TagsList Variables

```css
:root {
  --arpix-tag-bg: #f3f4f6;
  --arpix-tag-text: #4b5563;
  --arpix-tag-text-dark: #e5e7eb;
}
```

## Customizing Theme Variables

You can customize the theme variables in two ways:

### 1. Global CSS

Add the variables to your global CSS file:

```css
/* assets/css/main.css */
:root {
  --arpix-primary-color: #8b5cf6; /* Purple instead of blue */
  --arpix-header-background: #f5f3ff;
  --arpix-header-text-color: #6d28d9;
}
```

### 2. Module Configuration

Set the variables in your nuxt.config.ts:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-arpix-data-table'],
  arpixDataTable: {
    themeVars: {
      'primary-color': '#8b5cf6',
      'header-background': '#f5f3ff',
      'header-text-color': '#6d28d9'
    }
  }
})
```

### 3. Component Props

Set the variables at the component level:

```vue
<template>
  <ArpixDataTable
    :columns="columns"
    :data-source="data"
    :theme-vars="{
      'primary-color': '#8b5cf6',
      'header-background': '#f5f3ff',
      'header-text-color': '#6d28d9'
    }"
  />
</template>
```

## Row Density

You can configure the row height with the `density` prop:

```vue
<template>
  <ArpixDataTable
    :columns="columns"
    :data-source="data"
    density="compact" <!-- 'normal' or 'compact' -->
  />
</template>
```

The `normal` density provides standard row height, while `compact` reduces the row height for more data density.

## Custom Styling

You can add custom CSS classes to the table:

```vue
<template>
  <ArpixDataTable
    :columns="columns"
    :data-source="data"
    table-class="my-custom-table"
  />
</template>

<style>
.my-custom-table {
  /* Custom styles */
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
}

.my-custom-table th {
  font-weight: 600;
  text-transform: uppercase;
}
</style>
```

## Status Colors

For status columns, you can customize the colors for each status value:

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

Each status can have:
- `background`: Background color of the status badge
- `text`: Text color of the status badge
- `border`: Border color of the status badge
