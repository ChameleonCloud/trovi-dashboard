<script setup>
import { RouterLink } from 'vue-router'
const props = defineProps({ artifact: Object })
</script>

<template>
  <div class="mt-8">
    <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Versions</h2>
    <div v-if="artifact.versions?.length">
      <ul class="space-y-2">
        <li
          v-for="version in artifact.versions"
          :key="version.uuid"
          class="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <RouterLink
            :to="`/artifacts/${artifact.uuid}/versions/${version.uuid}`"
            class="text-gray-900 dark:text-gray-100"
          >
            {{ version.slug }}
          </RouterLink>
          <p class="text-gray-500 dark:text-gray-400 text-sm">{{ version.created_at }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>
