<script setup>
import { RouterLink } from 'vue-router';
import ArtifactListing from './ArtifactListing.vue';
import { reactive, defineProps, onMounted } from 'vue';
import PulseLoader from 'vue-spinner/src/PulseLoader.vue';
import axios from 'axios';

defineProps({
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
});

onMounted(async () => {
  try {
    const response = await axios.get('/api/artifacts');
    state.artifacts = response.data;
    // Extract tags from artifacts for filtering options
    state.allTags = [...new Set(state.artifacts.flatMap(artifact => artifact.tags))];
  } catch (error) {
    console.error('Error fetching artifacts', error);
  } finally {
    state.isLoading = false;
  }
});

function toggleTag(tag) {
  if (state.selectedTags.includes(tag)) {
    state.selectedTags = state.selectedTags.filter(t => t !== tag);
  } else {
    state.selectedTags.push(tag);
  }
}
</script>

<template>
  <section class="bg-green-50 px-4 py-10">
    <div class="container-xl lg:container m-auto">
      <h2 class="text-3xl font-bold text-stone-900 mb-6 text-center">
        Browse Artifacts
      </h2>

      <!-- Search Bar -->
      <div class="mb-6">
        <input type="text" placeholder="Search artifacts..."
          class="w-full px-4 py-3 border border-gray-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-500 transition duration-100" />
      </div>

      <!-- Search by Tags -->
      <div class="mb-6">
        <div class="text-lg font-medium mb-2">Search by:</div>
        <div class="flex flex-wrap gap-2">
          <label v-for="tag in state.allTags" :key="tag" class="flex items-center cursor-pointer">
            <input type="checkbox" :value="tag" v-model="state.selectedTags"
              class="mr-2 form-checkbox h-4 w-4 text-lime-600 border-gray-300 rounded" />
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
        <ArtifactListing v-for="artifact in state.artifacts.slice(0, limit || state.artifacts.length)"
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
