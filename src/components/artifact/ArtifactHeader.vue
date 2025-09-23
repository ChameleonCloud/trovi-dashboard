<script setup>
import ArtifactBadge from '@/components/artifact/ArtifactBadge.vue'
const props = defineProps({ artifact: Object })
</script>

<template>
  <div class="row items-center justify-between q-mb-md q-mt-lg">
    <h1 class="text-h4 text-primary q-mr-sm">
      {{ artifact.title }}
    </h1>

    <div class="row items-center q-gutter-sm">
      <span v-if="artifact.visibility === 'private' && !artifact.computed.hasDoi">
        <i class="pi pi-eye-slash"></i>
      </span>

      <template v-for="(badge, index) in artifact.badges" :key="index">
        <ArtifactBadge :badge="badge" />
      </template>

      <RouterLink
        v-if="artifact?.computed?.isOwnedByUser()"
        :to="'/artifacts/' + artifact.uuid + '/edit'"
      >
        <q-btn color="secondary" label="Edit" />
      </RouterLink>
    </div>
  </div>
</template>
