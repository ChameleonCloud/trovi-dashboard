<script setup>
const props = defineProps({ authors: Array })
</script>

<template>
  <div v-if="authors?.length" class="mt-8">
    <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Authors</h2>
    <ul class="space-y-3">
      <li
        v-for="(author, index) in authors"
        :key="index"
        class="flex items-center space-x-3 text-gray-700 dark:text-gray-300"
      >
        <div>
          <div class="text-md font-semibold">{{ author.full_name }}</div>
          <div class="text-sm">{{ author.affiliation }}</div>
          <div class="text-sm">{{ author.email }}</div>
        </div>
      </li>
    </ul>
  </div>
</template>
