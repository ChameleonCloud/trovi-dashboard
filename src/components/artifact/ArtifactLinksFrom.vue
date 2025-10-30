<script setup>
const props = defineProps({ artifact: Object })
</script>

<template>
  <div v-if="artifact.linked_from.length > 0" class="q-mb-lg">
    <h2 class="text-h6 text-primary">Related to:</h2>
    <ol class="q-mb-sm">
      <li v-for="a in artifact.linked_from" :key="a.source_artifact">
        <a :href="'/artifacts/' + a.source_artifact"> "{{ a.linked_from_title }}" </a>
      </li>
    </ol>
  </div>
</template>
