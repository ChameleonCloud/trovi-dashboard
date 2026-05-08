<script setup>
import { computed } from 'vue'

const { artifact, version_slug } = defineProps({
  artifact: Object,
  version_slug: String,
})

const sharingKey = computed(() => {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('sharing_key')
})

const selectedVersion = computed(() => {
  if (!artifact || !version_slug) return null
  const versions = artifact.versions || []
  return versions.find((v) => v.slug === version_slug) || null
})

const isJupyterHub = computed(() => {
  const v = selectedVersion.value
  const setup = Array.isArray(v?.environment_setup) ? v.environment_setup : []
  return setup.some((e) => e.type === 'jupyterhub')
})

const genericJupyter = computed(() => {
  const v = selectedVersion.value
  const setup = Array.isArray(v?.environment_setup) ? v.environment_setup : []
  const entry = setup.find((e) => e.type === 'source_code' && e.arguments && e.arguments.url)
  return entry ? entry.arguments : null
})
</script>

<template>
  <div v-if="version_slug">
    <h2 class="text-h6 text-primary">Content</h2>

    <div class="q-mb-sm" v-if="isJupyterHub || genericJupyter">
      <q-btn
        color="primary"
        label="Launch on Chameleon"
        :href="artifact.computed.get_chameleon_launch_url(version_slug, sharingKey)"
        target="_blank"
        class="full-width"
      />
    </div>

    <div class="q-mb-sm" v-if="!isJupyterHub">
      <q-chip
        color="grey"
        text-color="white"
        class="full-width justify-center cursor-inherit"
      >
        External Artifact
      </q-chip>
    </div>

    <div class="q-mb-sm">
      <q-btn
        color="primary"
        label="Download Archive"
        :href="artifact.computed.get_chameleon_download_url(version_slug, sharingKey)"
        v-if="artifact.computed.github_url"
        target="_blank"
        class="full-width"
      />
    </div>

    <div v-if="artifact.reproducibility.enable_requests" class="q-mb-sm">
      <q-btn
        color="primary"
        label="Request daypass"
        :href="artifact.computed.get_chameleon_request_daypass_url()"
        target="_blank"
        class="full-width"
      />
    </div>

    <div v-if="!isJupyterHub && artifact.computed.source_url" class="q-mb-sm">
      <q-btn
        color="primary"
        label="View source"
        :href="artifact.computed.source_url"
        target="_blank"
        class="full-width q-mb-sm"
      />

      <div
        v-if="artifact.computed.source_provider === 'github'"
        class="rounded-borders q-pa-sm code"
      >
        <code>
          <pre>
git clone {{ artifact.computed.source_url }}
<template v-if="artifact.computed.git_ref">
# cd into the created directory
git checkout {{ artifact.computed.git_ref }}
</template></pre>
        </code>
      </div>
    </div>
  </div>
</template>
