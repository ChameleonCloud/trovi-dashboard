<script setup>
import { reactive, onMounted, computed } from 'vue'
import TagFilter from '@/components/TagFilter.vue'
import ArtifactGrid from '@/components/artifact/ArtifactGrid.vue'
import MainSection from '@/components/MainSection.vue'

import { useArtifactsStore } from '@/stores/artifact'
import { QSpinnerDots } from 'quasar'
import { useRoute } from 'vue-router'
import { filterArtifacts } from '@/util'

const route = useRoute()

const artifactsStore = useArtifactsStore()
artifactsStore.fetchAllArtifacts()
artifactsStore.fetchTags()

const props = defineProps({
  limit: Number,
  showButton: {
    type: Boolean,
    default: false,
  },
})

const state = reactive({
  artifacts: [],
  badges: [],
  selectedTags: route.query.tags ? route.query.tags.split(',') : [],
  selectedBadges: route.query.badges ? route.query.badges.split(',') : [],
  searchText: route.query.q || '',
  filterOwned: route.query.owned === '1',
  filterPublic: route.query.public === '1',
  filterDoi: route.query.doi === '1',
  filterCollection: route.query.collection === '1',
})

const filteredArtifacts = computed(() => {
  const filtered = filterArtifacts(state.artifacts, {
    searchText: state.searchText,
    selectedTags: state.selectedTags,
    selectedBadges: state.selectedBadges,
    filterOwned: state.filterOwned,
    filterPublic: state.filterPublic,
    filterDoi: state.filterDoi,
    filterCollection: state.filterCollection,
  })

  return filtered.slice(0, props.limit || state.artifacts.length)
})

const isLoading = computed(() => artifactsStore.loading)

onMounted(async () => {
  try {
    state.artifacts = artifactsStore.artifacts
    state.badges = artifactsStore.processed_badges.badges
  } catch (error) {
    console.error('Error fetching artifacts', error)
  }
})
</script>

<template>
  <MainSection>
    <h1 class="text-center text-h4 q-mb-lg">Browse Artifacts</h1>

    <TagFilter
      :tags="artifactsStore.tags"
      :badges="state.badges"
      v-model:filterOwned="state.filterOwned"
      v-model:filterPublic="state.filterPublic"
      v-model:selectedTags="state.selectedTags"
      v-model:selectedBadges="state.selectedBadges"
      v-model:filterDoi="state.filterDoi"
      v-model:searchText="state.searchText"
    />

    <div class="row justify-end">
      Displaying {{ filteredArtifacts.length }} of
      <template v-if="!isLoading"> {{ artifactsStore.artifacts.length }}</template>
      <template v-else>
        <QSpinnerDots class="q-mx-sm" size="1.6em" />
      </template>
      artifacts
    </div>

    <ArtifactGrid
      :artifacts="filteredArtifacts"
      :is-loading="(!props.limit || state.artifacts.length < props.limit) && isLoading"
    />
  </MainSection>

  <section v-if="showButton" class="q-mx-auto q-my-xl q-pa-md" style="max-width: 32rem">
    <q-btn
      :to="{
        path: '/artifacts',
        query: {
          q: state.searchText || undefined,
          tags: state.selectedTags.length ? state.selectedTags.join(',') : undefined,
          badges: state.selectedBadges.length ? state.selectedBadges.join(',') : undefined,
          owned: state.filterOwned ? '1' : undefined,
          public: state.filterPublic ? '1' : undefined,
          doi: state.filterDoi ? '1' : undefined,
          collection: state.filterCollection ? '1' : undefined,
        },
      }"
      color="primary"
      class="full-width justify-center"
    >
      View All Artifacts
    </q-btn>
  </section>
</template>
