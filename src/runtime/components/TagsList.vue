<template>
  <div class="arpix-tags-container">
    <span
      v-for="(tag, index) in tags"
      :key="index"
      class="arpix-tag"
      :class="{ 'arpix-tag-clickable': clickable }"
      :style="getTagStyle(tag)"
      @click="handleTagClick(tag)"
    >
      <slot name="tag" :tag="tag">
        {{ tag }}
      </slot>
    </span>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  /**
   * Array of tags to display
   */
  tags: string[] | number[];

  /**
   * Custom colors for specific tags
   * @example { 'important': '#ff0000', 'normal': '#00ff00' }
   */
  colorMap?: Record<string, string>;

  /**
   * Default background color for tags without a specific color in colorMap
   * @default '#f3f4f6'
   */
  defaultColor?: string;

  /**
   * Whether tags are clickable
   * @default false
   */
  clickable?: boolean;
}>();

const emit = defineEmits<{
  /**
   * Emitted when a tag is clicked (if clickable is true)
   */
  'tag-click': [tag: string | number];
}>();

/**
 * Get style object for a tag
 */
const getTagStyle = (tag: string | number) => {
  const tagString = String(tag);
  const style: Record<string, string> = {};

  if (props.colorMap && tagString in props.colorMap) {
    style.backgroundColor = props.colorMap[tagString];
  } else {
    style.backgroundColor = props.defaultColor || 'var(--arpix-tag-bg, #f3f4f6)';
  }

  return style;
};

/**
 * Handle tag click event
 */
const handleTagClick = (tag: string | number) => {
  if (props.clickable) {
    emit('tag-click', tag);
  }
};
</script>

<style>
.arpix-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.arpix-tag {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--arpix-tag-text, #4b5563);
  white-space: nowrap;
}

.arpix-tag-clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.arpix-tag-clickable:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}

/* Dark theme support */
.theme-dark .arpix-tag {
  color: var(--arpix-tag-text-dark, #e5e7eb);
}
</style>
