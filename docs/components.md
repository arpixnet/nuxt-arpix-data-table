# Reusable Components

Nuxt Arpix Data Table includes several reusable components that you can use in your tables or anywhere in your application.

## ProgressBar

The `ProgressBar` component provides a visual progress bar that can be used to display percentages or progress values.

### Properties

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `value` | `number` | The progress value (0-100) | - |
| `color` | `string` | Custom color for the progress bar | Automatic based on value |
| `showLabel` | `boolean` | Show the value as text | `true` |
| `suffix` | `string` | Suffix to add to the value (e.g. '%') | `'%'` |

### Basic Usage

```vue
<template>
  <ProgressBar :value="75" />
</template>
```

### Customization

```vue
<template>
  <ProgressBar
    :value="75"
    color="#8b5cf6"
    :show-label="true"
    suffix="%"
  />
</template>
```

### Usage in Tables

```vue
<template>
  <ArpixDataTable :columns="columns" :data-source="data">
    <template #cell(progress)="{ value }">
      <ProgressBar :value="value" />
    </template>
  </ArpixDataTable>
</template>
```

## TagsList

The `TagsList` component displays a list of tags with customizable styles and support for interaction.

### Properties

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `tags` | `string[] \| number[]` | Array of tags to display | - |
| `colorMap` | `Record<string, string>` | Custom colors for specific tags | - |
| `defaultColor` | `string` | Default background color for tags without a specific color | `'#f3f4f6'` |
| `clickable` | `boolean` | Indicates if the tags are clickable | `false` |

### Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `tag-click` | `(tag: string \| number)` | Emitted when a tag is clicked (if `clickable` is `true`) |

### Basic Usage

```vue
<template>
  <TagsList :tags="['Frontend', 'Backend', 'API']" />
</template>
```

### With Custom Colors

```vue
<template>
  <TagsList
    :tags="['Frontend', 'Backend', 'API']"
    :color-map="{
      Frontend: '#ede9fe',
      Backend: '#f3e8ff',
      API: '#fae8ff'
    }"
  />
</template>
```

### Clickable Tags

```vue
<template>
  <TagsList
    :tags="['Frontend', 'Backend', 'API']"
    :clickable="true"
    @tag-click="handleTagClick"
  />
</template>

<script setup>
const handleTagClick = (tag) => {
  // Handle tag click event
}
</script>
```

### Usage in Tables

```vue
<template>
  <ArpixDataTable :columns="columns" :data-source="data">
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
  Frontend: '#ede9fe',
  Backend: '#f3e8ff',
  API: '#fae8ff',
  Mobile: '#fce7f3',
  Database: '#fef3c7'
}

const handleTagClick = (tag) => {
  // Handle tag click event
}
</script>
```

## Style Customization

Both components use CSS variables that you can customize in your application:

### CSS Variables for ProgressBar

```css
:root {
  --arpix-progress-bg: #f3f4f6;
  --arpix-progress-text: #1f2937;
  --arpix-progress-bg-dark: #374151;
  --arpix-progress-text-dark: #f9fafb;
  --arpix-error-color: #ef4444;
  --arpix-warning-color: #f59e0b;
  --arpix-success-color: #10b981;
}
```

### CSS Variables for TagsList

```css
:root {
  --arpix-tag-bg: #f3f4f6;
  --arpix-tag-text: #4b5563;
  --arpix-tag-text-dark: #e5e7eb;
}
```

You can override these variables in your global CSS file or configure them through the module options:

```js
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-arpix-data-table'],
  arpixDataTable: {
    themeVars: {
      'progress-bg': '#f0f0f0',
      'tag-bg': '#e5e7eb',
      // ...other variables
    }
  }
})
```
