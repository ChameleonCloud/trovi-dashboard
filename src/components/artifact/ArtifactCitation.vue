<template>
  <q-card class="q-pa-md q-mt-sm">
    <div class="q-mb-md flex justify-between items-center">
      <div>
        <q-btn
          flat
          color="primary"
          label="Citation"
          class="q-mx-xs"
          :unelevated="format === 'citation'"
          :text-color="format === 'citation' ? 'primary' : 'grey-7'"
          @click="format = 'citation'"
        />
        <q-btn
          flat
          color="primary"
          label="BibTeX"
          class="q-mx-xs"
          :unelevated="format === 'bibtex'"
          :text-color="format === 'bibtex' ? 'primary' : 'grey-7'"
          @click="format = 'bibtex'"
        />
      </div>
      <div>
        <q-btn
          flat
          color="secondary"
          icon="content_copy"
          @click="copyToClipboard(format === 'citation' ? citation : bibtex)"
        />
      </div>
    </div>
    <div v-if="format === 'citation'" class="code code-wrap">
      <div>{{ citation }}</div>
    </div>
    <div v-else class="code">
      <pre>{{ bibtex }}</pre>
    </div>
  </q-card>
</template>

<script setup>
import { Notify } from 'quasar'
import { ref, computed } from 'vue'
const props = defineProps({ artifact: Object, version: Object, ack: String })

const format = ref('citation')

const latestVersion = computed(
  () =>
    props.version ??
    (props.artifact?.versions?.find(
      (v) => v.slug === props.artifact?.computed?.latestVersion?.slug,
    ) ||
      props.artifact?.versions?.[0]),
)

const authorList = computed(() => props.artifact?.authors?.map((a) => a.full_name).join(', ') ?? '')
const troviUrl = computed(() =>
  props.artifact?.uuid ? `https://trovi.chameleoncloud.org/artifacts/${props.artifact.uuid}` : '',
)
const doi = computed(() => {
  if (!props.artifact.computed.hasDoi) {
    return ''
  }
  let latestDoi = latestVersion.value.computed?.doi
  if (!latestDoi) {
    let firstV = props.artifact?.versions?.find((v) => v.computed?.doi)
    latestDoi = firstV?.computed.doi
  }
  return `${latestDoi}.` || ''
})
const citation = computed(() =>
  `${authorList.value}. (${props.artifact.computed.latestYear}). ${props.artifact?.title ?? ''}. Trovi. ${troviUrl.value}. ${doi.value}`.trim(),
)
const bibtexKey = computed(() => {
  const author = props.artifact?.authors?.[0]?.full_name?.split(' ')[0] ?? 'author'
  const yr = props.artifact.computed.latestYear || 'year'
  const titleWords = props.artifact?.title?.split(' ').slice(0, 2).join('_') ?? 'title'
  return `${author}_${yr}_${titleWords}`.toLowerCase()
})
const note = computed(() => {
  const result = []
  for (const badge of props.artifact.badges) {
    if (badge.name === 'reproducible') result.push('NSF Award No. 2226406')
    if (badge.name === 'educational') result.push('NSF Award No. 2230077')
  }
  if (result.length === 0) return ''
  return `This material is supported by ${result.join(', ')}`
})
const bibtex = computed(() => {
  return `@misc{${bibtexKey.value},
    author={${authorList.value}},
    title={${props.artifact?.title ?? ''}},
    publisher={{Trovi}},
    url={${troviUrl.value}},${doi.value ? `\n    doi={${doi.value}},` : ''}
    year={${props.artifact.computed.latestYear}},
    month={${props.artifact.computed.latestMonth}},${note.value ? `\n    note={${note.value}},` : ''}
  }
}`
})
function copyToClipboard(text) {
  if (navigator?.clipboard) {
    navigator.clipboard.writeText(text)
  } else {
    // Fallback for older browsers
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
  Notify.create({
    type: 'positive',
    message: 'Copied to clipboard',
  })
}
</script>
