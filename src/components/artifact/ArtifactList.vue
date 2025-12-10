<script setup>
import { reactive, onMounted, computed, watch, ref } from 'vue'
import TagFilter from '@/components/TagFilter.vue'
import ArtifactGrid from '@/components/artifact/ArtifactGrid.vue'
import MainSection from '@/components/MainSection.vue'
import { filterArtifacts } from '@/util'
import { useArtifactsStore } from '@/stores/artifact'
import { QSpinnerDots } from 'quasar'
import { useRoute } from 'vue-router'

const route = useRoute()

const artifactsStore = useArtifactsStore()
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
  sortBy: route.query.sort_by || '',
  filterOwned: route.query.owned === '1',
  filterPublic: route.query.public === '1',
  filterDoi: route.query.doi === '1',
  filterCollection: route.query.collection === '1',
  showAllArtifacts: false,
})

const isSearching = ref(false)

const locallyFilteredArtifacts = computed(() => {
  return filterArtifacts(state.artifacts, {
    selectedBadges: state.selectedBadges,
    filterOwned: state.filterOwned,
    filterPublic: state.filterPublic,
    filterDoi: state.filterDoi,
    filterCollection: state.filterCollection,
  })
})

const displayedArtifacts = computed(() => {
  const artifactsToDisplay = state.showAllArtifacts ? locallyFilteredArtifacts.value : locallyFilteredArtifacts.value.slice(0, props.limit || locallyFilteredArtifacts.value.length)
  return artifactsToDisplay
})

const isLoading = computed(() => artifactsStore.loading)

async function performSearch() {
  if (isSearching.value) return

  isSearching.value = true
  try {
    await artifactsStore.fetchAllArtifacts({
      q: state.searchText,
      sortBy: state.sortBy,
      tags: state.selectedTags,
    })
    state.artifacts = artifactsStore.artifacts
  } catch (error) {
    console.error('Error fetching artifacts', error)
  } finally {
    isSearching.value = false
  }
}

watch(
  [() => state.selectedTags, () => state.sortBy],
  async () => {
    await performSearch()
  },
  { deep: true },
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
      v-model:sortBy="state.sortBy"
      :isSearching="isSearching"
      @search="handleSearch"
    />

    <div class="row justify-between items-center q-my-md">
      <div>
        <template v-if="!isSearching">
          Displaying {{ displayedArtifacts.length }} of {{ artifactsStore.artifacts.length }} artifacts
        </template>
        <template v-else>
          <QSpinnerDots class="q-mr-sm" size="1.6em" />
          Searching artifacts...
        </template>
      </div>

      <div class="row items-center q-gutter-sm">
        <span>Sort by:</span>
        <q-select
          v-model="state.sortBy"
          :options="[
            { label: 'Relevance', value: '' },
            { label: 'Creation Date', value: 'created_at' },
            { label: 'Updated Date', value: 'updated_at' },
            { label: 'Access Count', value: 'access_count' },
            { label: 'Unique Access Count', value: 'unique_access_count' },
            { label: 'Unique Cell Execution Count', value: 'unique_cell_execution_count' },
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
      :is-loading="(!props.limit || state.artifacts.length < props.limit) && isLoading"
    />
  </MainSection>

  <section v-if="showButton && !state.showAllArtifacts && displayedArtifacts.length < artifactsStore.artifacts.length" class="q-mx-auto q-my-xl q-pa-md" style="max-width: 32rem">
    <q-btn
      @click="showAllArtifacts"
      color="primary"
      class="full-width justify-center"
    >
      View All Artifacts
    </q-btn>
  </section>
</template>
