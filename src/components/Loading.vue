<script setup>
const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div class="relative w-full h-full">
    <!-- Default slot (your wrapped content) -->
    <div v-if="!loading" :class="{ 'opacity-50 pointer-events-none': loading }">
      <slot />
    </div>
    <div
      v-else
      class="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-black/50"
    >
      <div
        class="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-blue-500"
      ></div>
    </div>
  </div>
</template>
