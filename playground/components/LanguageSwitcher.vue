<template>
  <div class="language-switcher">
    <button
      v-for="locale in availableLocales"
      :key="locale"
      @click="changeLocale(locale)"
      :class="{ active: currentLocale === locale }"
    >
      {{ locale.toUpperCase() }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNuxtApp } from '#app'

const availableLocales = ['en', 'es', 'fr']
const currentLocale = ref('en')

// Change the locale
const changeLocale = (locale: string) => {
  // Update the locale in the module options
  useNuxtApp().$config.public.arpixDataTable.i18n.defaultLocale = locale
  currentLocale.value = locale

  // Force a refresh of the page to apply the new locale
  window.location.reload()
}

// Initialize the current locale
onMounted(() => {
  currentLocale.value = useNuxtApp().$config.public.arpixDataTable.i18n.defaultLocale || 'en'
})
</script>

<style>
.language-switcher {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
}

.language-switcher button {
  padding: 0.5rem 1rem;
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.language-switcher button:hover {
  background-color: #e2e8f0;
}

.language-switcher button.active {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
}
</style>
