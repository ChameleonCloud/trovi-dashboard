<script setup>
import { reactive, onMounted, computed, watch, ref } from 'vue'
import TagFilter from '@/components/TagFilter.vue'
import ArtifactGrid from '@/components/artifact/ArtifactGrid.vue'
import MainSection from '@/components/MainSection.vue'
import { filterArtifacts } from '@/util'
import { useArtifactsStore } from '@/stores/artifact'
import { QSpinnerDots } from 'quasar'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const artifactsStore = useArtifactsStore()
artifactsStore.fetchTags()

const props = defineProps({
  limit: Number,
  showButton: {
    type: Boolean,
    default: false,
  },
})

function filtersFromQuery(query) {
  return {
    selectedTags: query.tags ? query.tags.split(',') : [],
    selectedBadges: query.badges ? query.badges.split(',') : [],
    filterOwned: query.owned === '1',
    filterPublic: query.public === '1',
    filterDoi: query.doi === '1',
    filterCollection: query.collection === '1',
    filterVideo: query.video === '1',
    filterVerified: query.verified === '1',
  }
}

const state = reactive({
  artifacts: [],
  badges: [],
  ...filtersFromQuery(route.query),
  searchText: route.query.q || '',
  sortBy: route.query.sort_by || 'recent_unique_access_count,verified_count,unique_access_count',
  showAllArtifacts: false,
})

const isSearching = ref(false)
let searchGeneration = 0

const locallyFilteredArtifacts = computed(() => {
  return filterArtifacts(state.artifacts, {
    selectedBadges: state.selectedBadges,
    filterOwned: state.filterOwned,
    filterPublic: state.filterPublic,
    filterDoi: state.filterDoi,
    filterCollection: state.filterCollection,
    filterVideo: state.filterVideo,
    filterVerified: state.filterVerified,
  })
})

const displayedArtifacts = computed(() => {
  const artifactsToDisplay = state.showAllArtifacts ? locallyFilteredArtifacts.value : locallyFilteredArtifacts.value.slice(0, props.limit || locallyFilteredArtifacts.value.length)
  return artifactsToDisplay
})

async function performSearch() {
  const myGeneration = (searchGeneration += 1)
  isSearching.value = true
  try {
    await artifactsStore.fetchAllArtifacts({
      q: state.searchText,
      sortBy: state.sortBy,
      tags: state.selectedTags,
    })
    if (myGeneration === searchGeneration) {
      state.artifacts = artifactsStore.artifacts
    }
  } catch (error) {
    console.error('Error fetching artifacts', error)
  } finally {
    if (myGeneration === searchGeneration) {
      isSearching.value = false
    }
  }
}

watch(
  [() => state.selectedTags.join(','), () => state.sortBy],
  async () => {
  await performSearch()
})

watch(
  () => state.sortBy,
  (sortBy) => router.replace({ query: { ...route.query, sort_by: sortBy } }),
)

watch(
  () => route.query,
  (query) => Object.assign(state, filtersFromQuery(query)),
)

onMounted(async () => {
  try {
    state.badges = artifactsStore.processed_badges.badges
    await performSearch()
  } catch (error) {
    console.error('Error fetching artifacts', error)
  }
})

watch(
  () => artifactsStore.artifacts,
  (newArtifacts) => {
    state.artifacts = newArtifacts
  },
)

const recentAccessLabel = ref('Recent Access Count')
watch(
  () => state.artifacts[0]?.metrics.recent_window_days,
  (days) => {
    if (days) recentAccessLabel.value = `Access Count (${days} days)`
  },
)

function handleSearch() {
  performSearch()
}

function showAllArtifacts() {
  state.showAllArtifacts = true
}
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
      v-model:filterCollection="state.filterCollection"
      v-model:filterVideo="state.filterVideo"
      v-model:filterVerified="state.filterVerified"
      v-model:sortBy="state.sortBy"
      :isSearching="isSearching && artifactsStore.artifacts.length === 0"
      @search="handleSearch"
    />

    <div class="row justify-between items-center q-my-md">
      <div class="row items-center q-gutter-xs">
        <template v-if="isSearching && artifactsStore.artifacts.length === 0">
          <QSpinnerDots size="1.6em" />
          <span>Searching artifacts...</span>
        </template>
        <template v-else>
          <span>Displaying {{ displayedArtifacts.length }} of {{ artifactsStore.artifacts.length }} artifacts</span>
          <QSpinnerDots v-if="isSearching" size="1em" />
        </template>
      </div>

      <div class="row items-center q-gutter-sm">
        <span>Sort by:</span>
        <q-select
          v-model="state.sortBy"
          :options="[
            { label: 'Relevance', value: 'recent_unique_access_count,verified_count,unique_access_count' },
            { label: 'Creation Date', value: 'created_at' },
            { label: 'Updated Date', value: 'updated_at' },
            { label: 'Access Count', value: 'access_count' },
            { label: recentAccessLabel, value: 'recent_access_count,access_count' },
            { label: 'Unique Access Count', value: 'unique_access_count' },
            { label: 'Unique Cell Execution Count', value: 'unique_cell_execution_count' },
            { label: 'Verifications', value: 'verified_count,unique_access_count' },
          ]"
          option-value="value"
          option-label="label"
          dense
          outlined
          emit-value
          map-options
          style="min-width: 200px"
        />
      </div>
    </div>

    <ArtifactGrid
      :artifacts="displayedArtifacts"
      :is-loading="(!props.limit || displayedArtifacts.length < props.limit) && isSearching"
    />
  </MainSection>
  <section
    v-if="
      showButton &&
      !state.showAllArtifacts &&
      displayedArtifacts.length > 0 &&
      displayedArtifacts.length < artifactsStore.artifacts.length
    "
    class="q-mx-auto q-my-xl q-pa-md"
    style="max-width: 32rem"
  >
    <q-btn
      @click="showAllArtifacts"
      color="primary"
      class="full-width justify-center"
    >
      View More Artifacts
    </q-btn>
  </section>
</template>
