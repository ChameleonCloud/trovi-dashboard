<script setup>
import { computed } from 'vue'
const props = defineProps({ artifact: Object, version_slug: String })

const sharingKey = computed(() => {
  if (typeof window !== 'undefined') {
    return new URLSearchParams(window.location.search).get('sharing_key')
  }
  return null
})
</script>

<template>
  <div v-if="version_slug">
    <h2 class="text-h6 text-primary">Content</h2>

    <div class="q-mb-sm">
      <q-btn
        color="primary"
        label="Launch on Chameleon"
        :href="artifact.computed.get_chameleon_launch_url(version_slug, sharingKey)"
        target="_blank"
        class="full-width"
      />
    </div>

    <div class="q-mb-sm">
      <q-btn
        color="primary"
        label="Download Archive"
        :href="artifact.computed.get_chameleon_download_url(version_slug, sharingKey)"
        target="_blank"
        class="full-width"
      />
    </div>

    <div v-if="artifact.computed.github_url" class="q-mb-sm">
      <q-btn
        color="primary"
        label="View on GitHub"
        :href="artifact.computed.github_url"
        target="_blank"
        class="full-width"
      />
    </div>
  </div>
</template>
