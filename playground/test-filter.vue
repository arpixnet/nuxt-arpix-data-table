<template>
  <div>
    <h1>Test Filter Component</h1>
    <button @click="showFilter = !showFilter">Toggle Filter</button>
    
    <div v-if="showFilter" style="position: fixed; top: 100px; left: 100px; z-index: 9999; background-color: white; border: 1px solid #ccc; padding: 20px;">
      This is a test filter menu
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showFilter = ref(false)
</script>
