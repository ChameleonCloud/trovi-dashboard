<script setup>
import LinkButton from '@/components/LinkButton.vue'

defineProps({
  to: {
    type: String,
    required: true,
  },
  to_label: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div class="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md">
    <h2 class="text-2xl font-bold text-stone-900 dark:text-white">{{ title }}</h2>
    <p class="mt-2 mb-4 text-stone-700 dark:text-stone-300">
      <slot></slot>
    </p>
    <LinkButton to="/about">{{ to_label }}</LinkButton>
  </div>
</template>
