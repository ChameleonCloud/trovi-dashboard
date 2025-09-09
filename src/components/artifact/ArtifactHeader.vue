<script setup>
import ArtifactBadge from '@/components/artifact/ArtifactBadge.vue'
const props = defineProps({ artifact: Object })
</script>

<template>
  <div class="flex justify-between mb-2 mt-5">
    <h1 class="text-3xl font-bold mr-2 text-gray-900 dark:text-gray-100">
      {{ artifact.title }}
    </h1>
    <span class="inline-flex items-center space-x-2">
      <span
        v-if="artifact.visibility == 'private' && !artifact.computed.hasDoi"
        class="rounded-full text-gray-500 dark:text-gray-400"
      >
        <i class="pi pi-eye-slash"></i>
      </span>
      <template v-for="(badge, index) in artifact.badges" :key="index">
        <ArtifactBadge :badge="badge" />
      </template>
      <RouterLink
        :to="'/artifacts/' + artifact.uuid + '/edit'"
        v-if="artifact.computed.isOwnedByUser()"
        class="h-[36px] bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg text-sm"
      >
        Edit
      </RouterLink>
    </span>
  </div>
</template>
