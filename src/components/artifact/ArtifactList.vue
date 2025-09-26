<script setup>
import { reactive, onMounted, computed } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import TagFilter from '@/components/TagFilter.vue'
import ArtifactGrid from '@/components/artifact/ArtifactGrid.vue'
import MainSection from '@/components/MainSection.vue'

import { useArtifactsStore } from '@/stores/artifact'

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
  selectedTags: [],
  selectedBadges: [],
  searchText: '',
  filterOwned: false,
  filterPublic: false,
  filterDoi: false,
})

const filteredArtifacts = computed(() => {
  return state.artifacts
    .filter((a) => {
      if (state.searchText) {
        const search = state.searchText.toLowerCase()
        const inArtifact = [a.title, a.long_description, a.short_description].some((f) =>
          f?.toLowerCase().includes(search),
        )
        const inAuthors = a.authors.some((author) =>
          [author.full_name, author.affiliation, author.email].some((f) =>
            f?.toLowerCase().includes(search),
          ),
        )
        return inArtifact || inAuthors
      }
      return true
    })
    .filter((a) => {
      if (state.selectedTags.length > 0) {
        const filteredTags = a.tags.filter((t) => state.selectedTags.includes(t))
        return filteredTags.length === state.selectedTags.length
      }
      return true
    })
    .filter((a) => {
      return (
        state.selectedBadges.length === 0 ||
        state.selectedBadges.every((b) => a.badges.some((ab) => ab.name === b))
      )
    })
    .filter((a) => !state.filterOwned || a.computed.isOwnedByUser())
    .filter((a) => !state.filterPublic || a.visibility === 'public')
    .filter((a) => !state.filterDoi || a.computed.hasDoi)
    .slice(0, props.limit || state.artifacts.length)
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

    <SearchBar v-model="state.searchText" />

    <TagFilter
      :tags="artifactsStore.tags"
      :badges="state.badges"
      v-model:filterOwned="state.filterOwned"
      v-model:filterPublic="state.filterPublic"
      v-model:selectedTags="state.selectedTags"
      v-model:selectedBadges="state.selectedBadges"
      v-model:filterDoi="state.filterDoi"
    />

    <ArtifactGrid :artifacts="filteredArtifacts" :is-loading="isLoading" />
  </MainSection>

  <section v-if="showButton" class="q-mx-auto q-my-xl q-pa-md" style="max-width: 32rem">
    <q-btn to="/artifacts" color="primary" class="full-width justify-center">
      View All Artifacts
    </q-btn>
  </section>
</template>
