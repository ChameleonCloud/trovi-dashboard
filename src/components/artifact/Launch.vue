<script setup>
import { computed } from 'vue'
import { LAUNCH_BUTTONS } from '@/util'

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

// The setups that have a launch button
const LAUNCHERS = { ...LAUNCH_BUTTONS, source_code: LAUNCH_BUTTONS.jupyterhub }

// Each launch option, with its index among the version's setups, which the portal
// launches it by
const launchOptions = computed(() =>
  (selectedVersion.value?.environment_setup || [])
    .map((setup, index) => ({ ...setup, index }))
    .filter((s) => s.type in LAUNCHERS && (s.type !== 'source_code' || s.arguments?.url)),
)
</script>

<template>
  <div v-if="version_slug">
    <h2 class="text-h6 text-primary">Content</h2>

    <div v-for="option in launchOptions" :key="option.index" class="q-mb-sm">
      <q-btn
        color="primary"
        :label="
          option.label
            ? `${LAUNCHERS[option.type].label} (${option.label})`
            : LAUNCHERS[option.type].label
        "
        :href="artifact.computed.get_chameleon_launch_url(version_slug, sharingKey, option.index)"
        target="_blank"
        class="full-width"
      >
        <q-tooltip>{{ LAUNCHERS[option.type].tooltip }}</q-tooltip>
      </q-btn>
    </div>

    <p v-if="!selectedVersion?.environment_setup?.length" class="text-caption text-grey-7">
      This version has no launch options.
    </p>

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

    <div v-if="artifact.computed.github_url" class="q-mb-sm">
      <q-btn
        color="primary"
        label="View on GitHub"
        :href="artifact.computed.github_url"
        target="_blank"
        class="full-width q-mb-sm"
      />

      <div class="rounded-borders q-pa-sm code">
        <code>
          <pre>
git clone {{ artifact.computed.github_url }}
# cd into the created directory git checkout
{{ artifact.computed.git_ref }}</pre
          >
        </code>
      </div>
    </div>
  </div>
</template>
