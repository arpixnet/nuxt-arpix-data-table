# Componentes Reutilizables

Nuxt Arpix Data Table incluye varios componentes reutilizables que puedes usar en tus tablas o en cualquier parte de tu aplicación.

## ProgressBar

El componente `ProgressBar` proporciona una barra de progreso visual que puede ser utilizada para mostrar porcentajes o valores de progreso.

### Propiedades

| Propiedad | Tipo | Descripción | Valor por defecto |
|-----------|------|-------------|-------------------|
| `value` | `number` | El valor de progreso (0-100) | - |
| `color` | `string` | Color personalizado para la barra de progreso | Automático basado en el valor |
| `showLabel` | `boolean` | Mostrar el valor como texto | `true` |
| `suffix` | `string` | Sufijo para añadir al valor (ej. '%') | `'%'` |

### Uso Básico

```vue
<template>
  <ProgressBar :value="75" />
</template>
```

### Personalización

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

### Uso en Tablas

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

El componente `TagsList` muestra una lista de etiquetas con estilos personalizables y soporte para interacción.

### Propiedades

| Propiedad | Tipo | Descripción | Valor por defecto |
|-----------|------|-------------|-------------------|
| `tags` | `string[] \| number[]` | Array de etiquetas a mostrar | - |
| `colorMap` | `Record<string, string>` | Colores personalizados para etiquetas específicas | - |
| `defaultColor` | `string` | Color de fondo predeterminado para etiquetas sin color específico | `'#f3f4f6'` |
| `clickable` | `boolean` | Indica si las etiquetas son clickeables | `false` |

### Eventos

| Evento | Parámetros | Descripción |
|--------|------------|-------------|
| `tag-click` | `(tag: string \| number)` | Emitido cuando se hace clic en una etiqueta (si `clickable` es `true`) |

### Uso Básico

```vue
<template>
  <TagsList :tags="['Frontend', 'Backend', 'API']" />
</template>
```

### Con Colores Personalizados

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

### Etiquetas Clickeables

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

### Uso en Tablas

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

## Personalización de Estilos

Ambos componentes utilizan variables CSS que puedes personalizar en tu aplicación:

### Variables CSS para ProgressBar

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

### Variables CSS para TagsList

```css
:root {
  --arpix-tag-bg: #f3f4f6;
  --arpix-tag-text: #4b5563;
  --arpix-tag-text-dark: #e5e7eb;
}
```

Puedes sobrescribir estas variables en tu archivo CSS global o configurarlas a través de las opciones del módulo:

```js
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-arpix-data-table'],
  arpixDataTable: {
    themeVars: {
      'progress-bg': '#f0f0f0',
      'tag-bg': '#e5e7eb',
      // ...otras variables
    }
  }
})
```
