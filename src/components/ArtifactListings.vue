<script setup>
import { RouterLink } from 'vue-router';
import ArtifactListing from './ArtifactListing.vue';
import { reactive, defineProps, onMounted, computed } from 'vue';
import PulseLoader from 'vue-spinner/src/PulseLoader.vue';

import { useArtifactsStore } from '@/stores/artifact';
const artifactsStore = useArtifactsStore();
artifactsStore.fetchAllArtifacts();

const props = defineProps({
  limit: Number,
  showButton: {
    type: Boolean,
    default: false,
  },
});

const state = reactive({
  artifacts: [],
  isLoading: true,
  selectedTags: [],
  allTags: [], // To hold all available tags for filtering
  searchText: ""
});

const filteredArtifacts = computed(() => {
  return state.artifacts.filter(a => {
    if(state.searchText){
      let searchString = state.searchText.toLowerCase()
      let inArtifactFields = [ // check artifact fields
          a.title?.toLowerCase(),
          a.long_description?.toLowerCase(),
          a.short_description?.toLowerCase(),
        ].some(s => s?.includes(searchString))
      let inAuthorFields = a.authors.some(author => // Check author fields
        [
          author.full_name?.toLowerCase(),
          author.affiliation?.toLowerCase(),
          author.email?.toLowerCase()
        ].some(s => s?.includes(searchString))
      )
      console.log(inArtifactFields, inAuthorFields)
      return inArtifactFields || inAuthorFields
    }
    return true
  })
  .filter(a => {
    if(state.selectedTags.length > 0){
      let filtered_tags = a.tags.filter(
        t => state.selectedTags.indexOf(t) >= 0
      )
      console.log(filtered_tags)
      return filtered_tags.length == state.selectedTags.length
    }
    return true
  })
  .slice(0, props.limit || state.artifacts.length)
})

onMounted(async () => {
  try {
    state.artifacts = await artifactsStore.fetchAllArtifacts();

    // Extract tags from artifacts for filtering options
    // TODO this should use the API
    state.allTags = [...new Set(state.artifacts.flatMap(artifact => artifact.tags))];
  } catch (error) {
    console.error('Error fetching artifacts', error);
  } finally {
    state.isLoading = false;
  }
});
</script>

<template>
  <section class="bg-green-50 px-4 py-10">
    <div class="container-xl lg:container m-auto">
      <h2 class="text-3xl font-bold text-stone-900 mb-6 text-center">
        Browse Artifacts
      </h2>

      <!-- Search Bar -->
      <div class="mb-6">
        <input v-model="state.searchText" type="text" placeholder="Search artifacts..."
          class="w-full px-4 py-3 border border-gray-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-500 transition duration-100" />
      </div>

      <!-- Search by Tags -->
      <div class="mb-6">
        <div class="flex flex-wrap gap-2">
          <span>Tag:</span>
          <label v-for="tag in state.allTags" :key="tag" class="flex items-center cursor-pointer">
            <input type="checkbox" :value="tag" v-model="state.selectedTags"
              class="mr-1 form-checkbox h-4 w-4 text-lime-600 border-gray-300 rounded" />
            <span class="text-lg font-medium text-gray-700 hover:text-lime-600 transition duration-300">
              {{ tag }}
            </span>
          </label>
        </div>
      </div>

      <!-- Show loading spinner while loading is true -->
      <div v-if="state.isLoading" class="text-center text-gray-500 py-6">
        <PulseLoader />
      </div>

      <!-- Show artifact listing when done loading -->
      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ArtifactListing v-for="artifact in filteredArtifacts"
          :key="artifact.uuid" :artifact="artifact" />
      </div>
    </div>
  </section>

  <section v-if="showButton" class="m-auto max-w-lg my-10 px-6">
    <RouterLink to="/artifacts"
      class="block bg-black text-white text-center py-4 px-6 rounded-xl hover:bg-lime-700 transition duration-300">
      View All artifacts
    </RouterLink>
  </section>
</template>
