<template>
  <div class="arpix-progress-wrapper">
    <div 
      class="arpix-progress-bar" 
      :style="{ 
        width: `${value}%`, 
        backgroundColor: color || getProgressColor(value)
      }"
    ></div>
    <span v-if="showLabel" class="arpix-progress-text">{{ value }}{{ suffix }}</span>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  /**
   * The progress value (0-100)
   */
  value: number;
  
  /**
   * Custom color for the progress bar
   * If not provided, a color will be determined based on the value
   */
  color?: string;
  
  /**
   * Whether to show the progress value as text
   * @default true
   */
  showLabel?: boolean;
  
  /**
   * Suffix to append to the progress value (e.g. '%')
   * @default '%'
   */
  suffix?: string;
}>();

/**
 * Get a color based on the progress value
 */
const getProgressColor = (value: number): string => {
  if (value < 30) return 'var(--arpix-error-color, #ef4444)'; // Red for low progress
  if (value < 70) return 'var(--arpix-warning-color, #f59e0b)'; // Amber for medium progress
  return 'var(--arpix-success-color, #10b981)'; // Green for high progress
};
</script>

<style>
.arpix-progress-wrapper {
  width: 100%;
  height: 20px;
  background-color: var(--arpix-progress-bg, #f3f4f6);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.arpix-progress-bar {
  height: 100%;
  transition: width 0.3s ease;
}

.arpix-progress-text {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--arpix-progress-text, #1f2937);
  font-size: 0.75rem;
  font-weight: 600;
}

/* Dark theme support */
.theme-dark .arpix-progress-wrapper {
  background-color: var(--arpix-progress-bg-dark, #374151);
}

.theme-dark .arpix-progress-text {
  color: var(--arpix-progress-text-dark, #f9fafb);
}
</style>
