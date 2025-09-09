<script setup>
import { reactive, onMounted, computed } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import TagFilter from '@/components/TagFilter.vue'
import ArtifactGrid from '@/components/artifact/ArtifactGrid.vue'
import LinkButton from '@/components/LinkButton.vue'
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
  selectedTags: [],
  selectedBadges: [],
  searchText: '',
})

const filteredArtifacts = computed(() => {
  return state.artifacts
    .filter((a) => {
      if (state.searchText) {
        let searchString = state.searchText.toLowerCase()
        let inArtifactFields = [
          // check artifact fields
          a.title?.toLowerCase(),
          a.long_description?.toLowerCase(),
          a.short_description?.toLowerCase(),
        ].some((s) => s?.includes(searchString))
        let inAuthorFields = a.authors.some(
          (
            author, // Check author fields
          ) =>
            [
              author.full_name?.toLowerCase(),
              author.affiliation?.toLowerCase(),
              author.email?.toLowerCase(),
            ].some((s) => s?.includes(searchString)),
        )
        return inArtifactFields || inAuthorFields
      }
      return true
    })
    .filter((a) => {
      if (state.selectedTags.length > 0) {
        let filtered_tags = a.tags.filter((t) => state.selectedTags.indexOf(t) >= 0)
        return filtered_tags.length == state.selectedTags.length
      }
      return true
    })
    .filter((a) => {
      return (
        state.selectedBadges.length == 0 ||
        state.selectedBadges.every((b) => {
          return a.badges.some((ab) => ab.name == b)
        })
      )
    })
    .slice(0, props.limit || state.artifacts.length)
})

const isLoading = computed(() => {
  return artifactsStore.loading
})

onMounted(async () => {
  try {
    state.artifacts = artifactsStore.artifacts
    state.badges = artifactsStore.processed_badges.badges
    // Extract tags from artifacts for filtering options
    // TODO this should use the API
  } catch (error) {
    console.error('Error fetching artifacts', error)
  }
})
</script>
<template>
  <MainSection>
    <h2 class="text-3xl font-bold text-stone-900 dark:text-white mb-6 text-center">
      Browse Artifacts
    </h2>

    <SearchBar v-model="state.searchText" />

    <TagFilter
      :tags="artifactsStore.tags"
      :badges="state.badges"
      v-model:selected-tags="state.selectedTags"
      v-model:selected-badges="state.selectedBadges"
    />

    <ArtifactGrid :artifacts="filteredArtifacts" :is-loading="isLoading" />
  </MainSection>

  <section v-if="showButton" class="m-auto max-w-lg my-10 px-6">
    <LinkButton to="/artifacts" class="w-full justify-center">View All Artifacts </LinkButton>
  </section>
</template>
