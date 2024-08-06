<!-- This brings the cards in the main browser -->

<script setup>
import PulseLoader from 'vue-spinner/src/PulseLoader.vue';
import BackButton from '@/components/BackButton.vue';
import { reactive, onMounted } from 'vue';
import { useRoute, RouterLink, useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const artifactId = route.params.uuid;

const state = reactive({
  artifact: {},
  isLoading: true,
});

const deleteArtifact = async () => {
  try {
    const confirm = window.confirm('Are you sure you want to delete this artifact?');
    if (confirm) {
      await axios.delete(`/api/artifacts/${artifactId}`);
      toast.success('Artifact Deleted Successfully');
      router.push('/artifacts');
    }
  } catch (error) {
    console.error('Error deleting artifact', error);
    toast.error('Artifact Not Deleted');
  }
};

onMounted(async () => {
  try {
    const response = await axios.get(`/api/artifacts/${artifactId}`);
    state.artifact = response.data;
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
            <!-- Start Button -->
            <div class="absolute top-4 right-4">
              <button
                class="text-gray-400 border border-gray-300 hover:bg-gray-200 px-3 py-1 ml-1 rounded-lg flex items-center text-sm">
                <i class="pi pi-star mr-1"></i> Start
              </button>
            </div>
            <div class="flex items-center justify-center md:justify-start mb-2 mt-5">
              <h1 class="text-3xl font-bold mr-2">{{ state.artifact.title }}</h1>
              <span class="text-sm text-gray-300 border border-gray-300 rounded-full px-2 ml-1">
                {{ state.artifact.visibility }}
              </span>
            </div>
            <div class="mb-1">
              <div class="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
                <span v-for="tag in state.artifact.tags" :key="tag" class="text-lime-600 flex items-center">
                  <i class="pi pi-tag mr-2"></i> {{ tag }}
                </span>
              </div>
              <div class="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <!-- Metrics Info -->
                <div v-for="version in state.artifact.versions" :key="version.slug"
                  class="text-gray-600 flex items-center">
                  <i class="pi pi-eye mr-2"></i>
                  <span>{{ version.metrics.access_count }}</span>
                </div>
                <div v-for="version in state.artifact.versions" :key="version.slug"
                  class="text-gray-600 flex items-center">
                  <i class="pi pi-user mr-2"></i>
                  <span>{{ version.metrics.unique_access_count }}</span>
                </div>
                <div v-for="version in state.artifact.versions" :key="version.slug"
                  class="text-gray-600 flex items-center">
                  <i class="pi pi-desktop mr-2"></i>
                  <span>{{ version.metrics.unique_cell_execution_count }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white p-6 rounded-lg shadow-md mt-6">
            <h3 class="text-lime-600 text-lg font-bold mb-2">About</h3>
            <p class="my-1">
              {{ state.artifact.long_description }}
            </p>
          </div>
        </main>

        <!-- Sidebar -->
        <aside>
          <!-- Versions Info -->
          <div class="bg-white p-6 rounded-lg shadow-md">
            <h3 class="text-xl font-bold mb-6">Versions</h3>
            <div v-for="version in state.artifact.versions" :key="version.slug" class="mb-6">
              <p><strong>Version:</strong> {{ version.slug }}</p>
              <p><strong>Created At:</strong> {{ version.created_at }}</p>
            </div>
          </div>

          <!-- Manage -->
          <div class="bg-white p-6 rounded-lg shadow-md mt-6">
            <h3 class="text-xl font-bold mb-6">Manage Artifact</h3>
            <RouterLink :to="`/artifacts/edit/${state.artifact.uuid}`"
              class="bg-lime-600 hover:bg-black text-white text-center font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline mt-4 block">
              Open with GitHub</RouterLink>
            <button @click="deleteArtifact"
              class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline mt-4 block">
              Delete Artifact
            </button>
          </div>
        </aside>
      </div>
    </div>
  </section>

  <div v-else class="text-center text-gray-500 py-6">
    <PulseLoader />
  </div>
</template>
