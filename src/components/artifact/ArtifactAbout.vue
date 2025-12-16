<script setup>
import ArtifactMetrics from '@/components/artifact/ArtifactMetrics.vue'
import { ref, computed } from 'vue'
import { copyToClipboard } from 'quasar'
import { parseImageUrn } from '@/util'

const props = defineProps({
  artifact: Object,
  selectedVersion: Object,
})

// I had cors issues getting these dynamically as well, so I hardcoded them
// but we can probably switch to fetching these from the API
const SITE_URLS = {
  'chi-uc': 'https://chi.uc.chameleoncloud.org/',
  'chi-tacc': 'https://chi.tacc.chameleoncloud.org/',
  'kvm-tacc': 'https://kvm.tacc.chameleoncloud.org/',
}

const SITE_NAMES = {
  'chi-uc': 'CHI@UC',
  'chi-tacc': 'CHI@TACC',
  'kvm-tacc': 'KVM@TACC',
}

function buildImageHref(siteKey, uuid) {
  const base = SITE_URLS[siteKey]
  if (!base || siteKey === 'other' || !uuid) {
    return null
  }
  return `${base}project/images/${uuid}`
}

function findTemplateEnv(version) {
  if (!version?.environment_setup) return null
  return version.environment_setup.find((e) => e.type === 'template' && e.arguments)
}

function isImageVersion(version) {
  if (!version?.environment_setup) return false
  return version.environment_setup.some((e) => e.type === 'image')
}

function collectVersionImages(version, { dedupeSet = null } = {}) {
  if (!isImageVersion(version)) return []

  const images = []

  const addImageFromUrn = (urn, label) => {
    if (!urn || !urn.startsWith('urn:trovi:image:')) return

    if (dedupeSet) {
      if (dedupeSet.has(urn)) return
      dedupeSet.add(urn)
    }

    const { siteKey, uuid } = parseImageUrn(urn)
    const href = buildImageHref(siteKey, uuid)

    images.push({
      label: label || siteKey,
      siteKey,
      uuid,
      href,
      urn,
      slug: version.slug,
    })
  }

  if (version.contents?.urn?.startsWith('urn:trovi:image:')) {
    const link = version.links?.find((l) => l.urn === version.contents.urn)
    addImageFromUrn(version.contents.urn, link?.label)
  }
  else if (Array.isArray(version.links)) {
    version.links
      .filter((l) => l.urn && l.urn.startsWith('urn:trovi:image:'))
      .forEach((l) => addImageFromUrn(l.urn, l.label))
  }

  return images
}

const imageList = computed(() => {
  const versions = props.artifact?.versions || []
  if (!versions.length) return []

  if (props.selectedVersion) {
    return collectVersionImages(props.selectedVersion)
  }

  const allImages = []
  const seen = new Set()

  const sorted = versions
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  sorted.forEach((v) => {
    if (v.deleted) return
    allImages.push(...collectVersionImages(v, { dedupeSet: seen }))
  })

  return allImages
})

const TEMPLATE_LAUNCH_SITES = ['chi-uc', 'chi-tacc']

const templateContent = computed(() => {
  const versions = props.artifact?.versions || []
  if (!versions.length) return null

  if (props.selectedVersion) {
    const env = findTemplateEnv(props.selectedVersion)
    return env ? { content: env.arguments, slug: props.selectedVersion.slug } : null
  }

  const visibleVersions = versions.filter((v) => !v.deleted)
  const sorted = visibleVersions
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  for (const v of sorted) {
    const env = findTemplateEnv(v)
    if (env) return { content: env.arguments, slug: v.slug }
  }

  return null
})

// Copy to clipboard
const copied = ref(false)

function doCopyTemplate() {
  const content = templateContent.value?.content
  if (!content) return

  copyToClipboard(content).then(() => {
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1400)
  })
}

// Template help dialog
const showTemplateHelp = ref(false)
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
  <p class="text-body1 q-mb-md" v-html="artifact.computed.long_description_markup"></p>

  <div v-if="imageList.length" class="q-mt-md">
    <h3 class="text-h6 text-primary q-mb-sm">Disk Images</h3>

    <div class="row q-col-gutter-md">
      <div
        v-for="(img, idx) in imageList"
        :key="img.slug + '-' + idx"
        class="col-12 col-md-6 col-lg-4 q-mb-md"
      >
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center q-gutter-sm q-mb-xs justify-between">
              <div>
                <strong>{{ SITE_NAMES[img.siteKey] || img.siteKey }}</strong>
                <span class="q-ml-xs text-caption">
                  Version:
                  <span class="text-weight-regular">{{ img.slug }}</span>
                </span>
              </div>

              <div>
                <q-btn
                  v-if="img.href"
                  color="primary"
                  size="sm"
                  :href="img.href"
                  target="_blank"
                  label="Launch"
                  class="q-mt-xs"
                />
                <q-btn
                  v-else
                  color="grey"
                  size="sm"
                  label="Launch Not Available"
                  disable
                  class="q-mt-xs"
                />
              </div>
            </div>

            <div>
              <span class="text-caption" style="font-size: 90%;">Disk Image:</span>
              <span class="text-caption">{{ img.uuid }}</span>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="text-caption text-grey-7 q-mt-sm">
      Note: To use a disk image, you will need to first create a reservation on the target site,
      and then launch an instance using this disk image within your reservation.
    </div>
  </div>

  <div v-if="templateContent" class="q-mt-xl">
    <h3 class="text-h6 text-primary q-mb-md">Template</h3>

    <q-card flat bordered class="bg-grey-1 q-mb-md" style="overflow: visible;">
      <q-card-section>
        <div class="row items-center justify-between q-mb-sm">
          <div class="text-caption">
            Version:
            <span class="text-weight-regular">{{ templateContent.slug }}</span>
          </div>

          <q-btn
            size="sm"
            color="primary"
            flat
            dense
            @click="doCopyTemplate"
            :label="copied ? 'Copied!' : 'Copy to clipboard'"
            :icon="copied ? 'check' : 'content_copy'"
          />
        </div>

        <pre
          class="q-ma-none q-pa-md rounded-borders bg-grey-2"
          style="
            white-space: pre-wrap;
            word-break: break-all;
            font-size: 15px;
            line-height: 1.45;
            max-height: 420px;
            overflow-x: auto;
            overflow-y: auto;
          "
        >{{ templateContent.content }}</pre>

        <div class="row items-center justify-between q-mt-md">
          <q-btn
            flat
            dense
            size="sm"
            class="text-caption"
            color="primary"
            label="How do I use this template?"
            @click="showTemplateHelp = true"
          />

          <div class="row items-center justify-end">
            <span class="text-body2 q-mr-xs">Launch on:</span>
            <q-btn
              v-for="key in TEMPLATE_LAUNCH_SITES"
              :key="key"
              color="secondary"
              size="sm"
              flat
              dense
              :label="SITE_NAMES[key]"
              :href="SITE_URLS[key] + 'dashboard/project/stacks/'"
              target="_blank"
              class="q-ml-xs"
              style="min-width: 66px; font-size: 14px; padding: 0 4px;"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-dialog v-model="showTemplateHelp" persistent>
      <q-card style="max-width: 480px;">
        <q-card-section class="text-h6">
          How to use this template
        </q-card-section>

        <q-card-section class="text-body2">
          <ol class="q-pl-lg q-mb-none">
            <li>Click “Copy to clipboard” to copy the template text.</li>
            <li>Use one of the “Launch on” links to open the Stacks page on your chosen site.</li>
            <li>Create a new stack and choose the option to use an existing template.</li>
            <li>Paste the copied template text into the template editor.</li>
            <li>Review the parameters and launch the stack.</li>
          </ol>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>
