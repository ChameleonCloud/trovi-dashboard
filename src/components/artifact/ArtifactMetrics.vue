<script setup>
const props = defineProps({ artifact: Object })
</script>

<template>
  <div v-if="artifact" class="row items-center q-gutter-sm text-body2">
    <div class="row items-center">
      <q-tooltip> Total Launches </q-tooltip>
      <q-icon name="visibility" class="q-mx-xs" />
      {{ artifact.computed.summedMetrics.access_count }}
    </div>
    <div class="row items-center">
      <q-tooltip>Unique Users </q-tooltip>
      <q-icon name="person" class="q-mx-xs" />
      {{ artifact.computed.summedMetrics.unique_access_count }}
    </div>
    <div class="row items-center">
      <q-tooltip> Users who ran in Jupyter </q-tooltip>
      <q-icon name="desktop_windows" class="q-mx-xs" />
      {{ artifact.computed.summedMetrics.unique_cell_execution_count }}
    </div>

    <div class="q-ml-lg">
      <q-tooltip> Last updated </q-tooltip>
      {{ artifact.updated_at }}
    </div>
  </div>
</template>
