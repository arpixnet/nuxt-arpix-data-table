<template>
  <div class="language-switcher">
    <div class="locale-info">Current locale: {{ currentLocale }}</div>
    <div class="buttons">
      <button
        v-for="locale in availableLocales"
        :key="locale"
        @click="changeLocale(locale)"
        :class="{ active: currentLocale === locale }"
      >
        {{ locale.toUpperCase() }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNuxtApp } from '#app'

const availableLocales = ['en', 'es', 'fr', 'pt']
const currentLocale = ref('')

// Get the current locale from the module options
const getCurrentLocale = () => {
  return useNuxtApp().$config.public.arpixDataTable.i18n.defaultLocale || 'en'
}

// Change the locale by setting a cookie and reloading the page
const changeLocale = (locale: string) => {
  // Don't do anything if the locale is already set
  if (locale === currentLocale.value) return

  // Set a cookie with the new locale
  document.cookie = `arpix-locale=${locale}; path=/; max-age=31536000`

  // Redirect to the same page with a query parameter to avoid caching issues
  window.location.href = `${window.location.pathname}?locale=${locale}`
}

// Initialize the current locale
onMounted(() => {
  // Get the current locale from the module options
  currentLocale.value = getCurrentLocale()

  // Check if we have a locale in the URL query parameters
  const urlParams = new URLSearchParams(window.location.search)
  const localeParam = urlParams.get('locale')

  if (localeParam && availableLocales.includes(localeParam)) {
    // Update the config with the locale from the URL
    useNuxtApp().$config.public.arpixDataTable.i18n.defaultLocale = localeParam
    currentLocale.value = localeParam
  }
})
</script>

<style>
.language-switcher {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background-color: #f8fafc;
}

.locale-info {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.buttons {
  display: flex;
  gap: 0.5rem;
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
