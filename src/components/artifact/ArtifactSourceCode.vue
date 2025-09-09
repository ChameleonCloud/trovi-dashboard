<script setup>
const props = defineProps({ url: String })
</script>

<template>
  <div class="mt-8">
    <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Source Code</h2>
    <a
      :href="url"
      target="_blank"
      class="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
    >
      View on GitHub
    </a>
  </div>
</template>
