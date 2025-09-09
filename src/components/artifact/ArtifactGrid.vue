<script setup>
import ArtifactListItem from '@/components/artifact/ArtifactListItem.vue'
import PulseLoader from 'vue-spinner/src/PulseLoader.vue'

defineProps({
  artifacts: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
})
</script>

<template>
  <div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <ArtifactListItem v-for="(artifact, index) in artifacts" :key="index" :artifact="artifact" />
    </div>
    <div v-if="isLoading" class="text-center text-gray-500 dark:text-stone-400 py-6">
      <PulseLoader />
    </div>
  </div>
</template>
