<script setup>
const props = defineProps({ artifact: Object })
</script>

<template>
  <div v-if="artifact.linked_artifacts.length > 0" class="q-mb-lg">
    <h2 class="text-h6 text-primary q-mb-md">Related Artifacts</h2>
    <ol class="q-mb-sm">
      <li v-for="a in artifact.linked_artifacts" :key="a.linked_artifact">
        <a :href="'/artifacts/' + a.linked_artifact"> "{{ a.linked_title }}" </a>
      </li>
    </ol>
  </div>
</template>
