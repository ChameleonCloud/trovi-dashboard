<script setup>
import PulseLoader from 'vue-spinner/src/PulseLoader.vue';
import BackButton from '@/components/BackButton.vue';
import Badge from '@/components/Badge.vue'
import { reactive, onMounted, computed } from 'vue';
import { useRoute, RouterLink } from 'vue-router';

import { useArtifactsStore } from '@/stores/artifact';

const route = useRoute();

const artifactId = route.params.uuid;
const artifactsStore = useArtifactsStore();

const state = reactive({
  artifact: {},
  isLoading: true,
});

onMounted(async () => {
  try {
    state.artifact = await artifactsStore.fetchArtifactById(artifactId);
  } catch (error) {
    console.error('Error fetching artifact', error);
  } finally {
    state.isLoading = false;
  }
});
</script>


<template>
  <BackButton />
  <section v-if="!state.isLoading" class="bg-green-50">
    <div class="container m-auto py-10 px-6">
      <div class="grid grid-cols-1 md:grid-cols-70/30 w-full gap-6">
        <main>
          <div class="bg-white p-6 rounded-lg shadow-md text-center md:text-left relative">
            <!-- Star Button -->
            <!-- UUID -->
            <!-- <span>{{ state.artifact.uuid }}</span> -->
            <!-- Title and Visibility -->
            <div class="flex justify-between mb-2 mt-5">
              <h1 class="text-3xl font-bold mr-2">{{ state.artifact.title }}</h1>
              <!-- <span class="text-sm text-gray-300 border border-gray-300 rounded-full px-2 ml-1">
                {{ state.artifact.visibility }}
              </span> -->
              <span class="inline-flex">
                <Badge :badge=badge v-for="badge in state.artifact.badges"/>
              </span>
            </div>

            <!-- Metrics Section -->
            <div class="text-gray-500 flex items-center gap-3 mt-4">
              <span v-tooltip.bottom="'Total Launches'"><i class="pi pi-eye text-gray-400 mr-1 ml-1"></i>{{ state.artifact.computed.summedMetrics.access_count }}</span>
              <span v-tooltip.bottom="'Unique Users'"><i class="pi pi-user text-gray-400 mr-1 ml-1"></i>{{ state.artifact.computed.summedMetrics.unique_access_count }}</span>
              <span v-tooltip.bottom="'Users who ran in Jupyter'"><i class="pi pi-desktop text-gray-400 mr-1 ml-1"></i>{{ state.artifact.computed.summedMetrics.unique_cell_execution_count }}</span>
              <!-- <i class="pi pi-star text-gray-400 mr-1 ml-1"></i> 10 -->
            </div>
          </div>

          <!-- About Section -->
          <div class="bg-white p-6 rounded-lg shadow-md mt-6">
            <h3 class="text-lime-600 text-lg font-bold mb-2">About</h3>
            <div class="mb-1">
              <div class="flex flex-wrap md:justify-start gap-2">
                <span v-for="tag in state.artifact.tags" :key="tag" class="text-lime-600 flex items-center">
                  <i class="pi pi-tag mr-2"></i> {{ tag }}
                </span>
              </div>
            </div>
            <p class="my-1 marked" v-html="state.artifact.computed.long_description_markup">
            </p>
          </div>
        </main>

        <aside>
          <div class="bg-white p-6 rounded-lg shadow-md">
            <h3 class="text-xl font-bold mb-2">Launch</h3>
            <button class="text-black-400 border border-black-300 hover:bg-black-200 px-2 py-1 rounded-lg flex items-center text-sm">
                <a target="_blank" :href="state.artifact.computed.chameleon_launch_url">
                  <span>Chameleon</span>
                </a>
              </button>
          </div>

          <div class="bg-white p-6 rounded-lg shadow-md mt-6">
            <h3 class="text-xl font-bold mb-1">Authors</h3>
            <div v-if="state.artifact.authors" class="mt-4">
              <div v-for="author in state.artifact.authors" :key="author.email" class="flex items-center mb-4">
                <img
                  :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(author.full_name)}&background=B2BEB5&color=fff&size=40`"
                  alt="Avatar" class="rounded-full mr-3">
                <div>
                  <div class="text-md font-semibold">{{ author.full_name }}</div>
                  <div class="text-sm text-gray-600">{{ author.email }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-lg shadow-md mt-6" v-if="state.artifact.computed.github_url">
            <h3 class="text-xl font-bold mb-2">Source Code</h3>
            <button
                class="text-black-400 border border-gray-300 hover:bg-gray-200 px-2 py-1 rounded-lg flex items-center text-sm">
                <a target="_blank" :href="state.artifact.computed.github_url">
                  <span><i class="pi pi-github mr-1"></i> GitHub</span>
                </a>
              </button>
          </div>

          <!-- Releases and Versions Info -->
          <div class="bg-white p-6 rounded-lg shadow-md mt-6">
            <h3 class="text-xl font-bold mb-2">Versions</h3>
            <div v-if="state.artifact.computed.latestVersion" class="mb-6">
              <p><strong>Latest Version:</strong> {{ state.artifact.computed.latestVersion.slug }}</p>
              <p><strong>Created At:</strong> {{ state.artifact.computed.latestVersion.created_at }}</p>
            </div>
            <div v-else>
              <p>This artifact has no versions.</p>
            </div>
          </div>

          <!-- Manage -->
          <!-- <div class="bg-white p-6 rounded-lg shadow-md mt-6">
            <h3 class="text-xl font-bold mb-6">Manage Artifact</h3>
            <RouterLink :to="`/artifacts/edit/${state.artifact.uuid}`"
              class="bg-lime-600 hover:bg-black text-white text-center font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline mt-4 block">
              Open with Chameleon</RouterLink>
            <button @click="deleteArtifact"
              class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline mt-4 block">
              Delete Artifact
            </button>
          </div> -->
        </aside>
      </div>
    </div>
  </section>

  <div v-else class="text-center text-gray-500 py-6">
    <PulseLoader />
  </div>
</template>
