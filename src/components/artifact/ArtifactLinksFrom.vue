<script setup>
import { computed } from 'vue'

const props = defineProps({ artifact: Object })

// Compute a sorted list with owned items first
const sortedLinkedFrom = computed(() => {
  if (!props.artifact?.linked_from) return []
  return [...props.artifact.linked_from].sort((a, b) => {
    const owner = props.artifact.owner_urn
    const aOwned = a.linked_from_owner === owner ? 0 : 1
    const bOwned = b.linked_from_owner === owner ? 0 : 1
    return aOwned - bOwned
  })
})
</script>

<template>
  <div v-if="artifact.linked_from.length > 0" class="q-mb-lg">
    <h2 class="text-h6 text-primary">Related to:</h2>
    <ol class="q-mb-sm">
      <li v-for="a in sortedLinkedFrom" :key="a.source_artifact">
        <a :href="'/artifacts/' + a.source_artifact"> "{{ a.linked_from_title }}" </a>
      </li>
    </ol>
  </div>
</template>
