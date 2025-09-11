<script setup>
import ArtifactMetrics from '@/components/artifact/ArtifactMetrics.vue'
const props = defineProps({ artifact: Object })
</script>

<template>
  <div class="flex justify-between items-center">
    <ArtifactMetrics :artifact="artifact" />

    <div v-if="artifact.tags?.length" class="flex flex-wrap gap-2 mb-4 mt-4">
      <span
        v-for="tag in artifact.tags"
        :key="tag"
        class="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm"
      >
        {{ tag }}
      </span>
    </div>
  </div>

  <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">About</h2>

  <p class="text-gray-700 dark:text-gray-300 whitespace-pre-line">
    {{ artifact.long_description }}
  </p>
</template>
