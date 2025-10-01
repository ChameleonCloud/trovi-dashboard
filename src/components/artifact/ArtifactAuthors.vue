<script setup>
const props = defineProps({ authors: Array })
</script>

<template>
  <div v-if="authors?.length" class="q-mt-sm">
    <h2 class="text-h6 text-primary q-mb-xs">Authors</h2>
    <ul class="column q-pl-xs q-gutter-md">
      <li v-for="(author, index) in authors" :key="index" class="row items-start q-gutter-xs">
        <div>
          <div class="text-subtitle2">{{ author.full_name }}</div>
          <div class="text-body2">{{ author.affiliation }}</div>
          <div class="text-body2">{{ author.email }}</div>
        </div>
      </li>
    </ul>
  </div>
</template>
