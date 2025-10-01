<script setup>
import { QSpinnerDots } from 'quasar'
import ArtifactListItem from '@/components/artifact/ArtifactListItem.vue'

const props = defineProps({
  artifacts: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
})
</script>

<template>
  <div class="q-pa-md">
    <div class="row q-col-gutter-md">
      <div v-for="(artifact, index) in artifacts" :key="index" class="col-4">
        <ArtifactListItem :artifact="artifact" class="full-height" />
      </div>
    </div>

    <div v-if="isLoading" class="row justify-center q-my-md">
      <QSpinnerDots size="40px" color="primary" />
    </div>

    <div v-if="!isLoading && artifacts.length === 0" class="text-center q-my-md">
      No artifacts found.
    </div>
  </div>
</template>

<style scoped>
.full-height {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
