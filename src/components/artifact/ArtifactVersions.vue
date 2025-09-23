<script setup>
const props = defineProps({ artifact: Object, version_slug: String })
</script>

<template>
  <div class="q-mt-sm">
    <h2 class="text-h6 text-primary q-mb-xs">Versions</h2>
    <div v-if="artifact.versions?.length">
      <q-list bordered padding class="q-pa-none">
        <q-item
          v-for="version in artifact.versions"
          :key="version.uuid"
          clickable
          :to="`/artifacts/${artifact.uuid}/versions/${version.slug}`"
        >
          <q-item-section>
            <div class="text-subtitle2">{{ version.slug }}</div>
            <div class="text-caption">{{ version.created_at }}</div>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <div v-else class="text-grey-6">No versions available.</div>
  </div>
</template>
