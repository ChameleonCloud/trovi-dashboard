<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  to: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <RouterLink
    :to="to"
    class="inline-block rounded-lg px-4 py-2 bg-black text-white hover:bg-lime-700 dark:bg-lime-600 dark:hover:bg-lime-500 dark:text-black font-medium transition-colors"
  >
    <slot></slot>
  </RouterLink>
</template>
