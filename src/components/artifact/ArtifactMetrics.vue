<script setup>
const props = defineProps({ artifact: Object })
</script>

<template>
  <div v-if="artifact">
    <span v-tooltip.bottom="'Total Launches'">
      <i class="pi pi-eye text-gray-400 dark:text-gray-500 mr-1 ml-1"></i>
      {{ artifact.computed.summedMetrics.access_count }}
    </span>
    <span v-tooltip.bottom="'Unique Users'">
      <i class="pi pi-user text-gray-400 dark:text-gray-500 mr-1 ml-1"></i>
      {{ artifact.computed.summedMetrics.unique_access_count }}
    </span>
    <span v-tooltip.bottom="'Users who ran in Jupyter'">
      <i class="pi pi-desktop text-gray-400 dark:text-gray-500 mr-1 ml-1"></i>
      {{ artifact.computed.summedMetrics.unique_cell_execution_count }}
    </span>
    <span class="ml-8" v-tooltip.bottom="'Last updated'">
      {{ artifact.updated_at }}
    </span>
  </div>
</template>
