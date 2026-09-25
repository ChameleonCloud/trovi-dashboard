<script setup>
import { computed } from 'vue'

const props = defineProps({ artifact: Object })

const publications = computed(() =>
  (props.artifact.publications ?? []).map((publication) => ({
    ...publication,
    href: publication.doi ? `https://doi.org/${publication.doi}` : publication.url,
    imprint: [publication.venue, publication.year].filter(Boolean).join(', '),
  })),
)

const heading = computed(() => (publications.value.length === 1 ? 'Publication' : 'Publications'))
</script>

<template>
  <div v-if="publications.length" class="q-mb-lg">
    <h2 class="text-h6 text-primary q-mb-md">{{ heading }}</h2>

    <ul class="column q-pl-xs q-gutter-md">
      <li v-for="(publication, index) in publications" :key="index">
        <div class="text-subtitle2">
          <a
            v-if="publication.href"
            :href="publication.href"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ publication.title }}
          </a>
          <span v-else>{{ publication.title }}</span>
        </div>
        <div v-if="publication.authors" class="text-body2">{{ publication.authors }}</div>
        <div v-if="publication.imprint" class="text-body2">{{ publication.imprint }}</div>
        <div v-if="publication.doi" class="text-caption">
          DOI:
          <a :href="`https://doi.org/${publication.doi}`" target="_blank" rel="noopener noreferrer">
            {{ publication.doi }}
          </a>
        </div>
      </li>
    </ul>
  </div>
</template>
