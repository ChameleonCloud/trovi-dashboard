<script setup>
import ArtifactMetrics from '@/components/artifact/ArtifactMetrics.vue'
const props = defineProps({ artifact: Object })
</script>

<template>
  <div class="row items-center justify-between q-mb-md">
    <ArtifactMetrics :artifact="artifact" />

    <div v-if="artifact.tags?.length" class="row q-gutter-sm q-mt-md q-mb-md">
      <q-chip v-for="tag in artifact.tags" :key="tag" class="text-body2">
        {{ tag }}
      </q-chip>
    </div>
  </div>

  <h2 class="text-h6 text-primary q-mb-md">About</h2>

  <p class="text-body1 q-mb-md">
    {{ artifact.long_description }}
  </p>
</template>
