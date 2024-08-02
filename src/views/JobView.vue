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

const jobId = route.params.uuid;

const state = reactive({
    job: {},
    isLoading: true,
});

const deleteJob = async () => {
    try {
        const confirm = window.confirm('Are you sure you want to delete this job?');
        if (confirm) {
            await axios.delete(`/api/jobs/${jobId}`);
            toast.success('Job Deleted Successfully');
            router.push('/jobs');
        }
    } catch (error) {
        console.error('Error deleting job', error);
        toast.error('Job was not deleted...');
    }
}

onMounted(async () => {
    try {
        const response = await axios.get(`/api/jobs/${jobId}`);
        state.job = response.data;
    } catch (error) {
        console.error('Error fetching job', error);
    } finally {
        state.isLoading = false;
    }
});
</script>

<template>
    <BackButton />
    <section v-if="!state.isLoading" class="bg-stone-100">
        <div class="container m-auto py-10 px-6">
            <div class="grid grid-cols-1 md:grid-cols-70/30 w-full gap-6">
                <main>
                    <div class="bg-white p-6 rounded-lg shadow-md text-center md:text-left">
                        <div class="text-gray-500 mb-4">{{ state.job.type }}</div>
                        <h1 class="text-3xl font-bold mb-4">{{ state.job.title }}</h1>
                        <div class="text-gray-500 mb-4 flex align-middle justify-center md:justify-start">
                            <div>
                                <div class="flex flex-wrap gap-2 mt-2">
                                    <template v-for="tag in state.job.tags" :key="tag">
                                        <span
                                            class="flex items-center bg-lime-500 text-white text-sm font-medium px-2.5 py-0.5 rounded-full">
                                            <i class="fas fa-tag mr-1"></i> {{ tag }}
                                        </span>
                                    </template>
                                </div>
                            </div>
                        </div>
                        <div class="text-gray-500 mt-4">
                            <p>Created At: {{ new Date(state.job.created_at).toLocaleDateString() }}</p>
                            <p>Last update: {{ new Date(state.job.updated_at).toLocaleDateString() }}</p>
                        </div>
                    </div>

                    <!-- Artifact Description (updated to long_description) -->
                    <div class="bg-white p-6 rounded-lg shadow-md mt-6">
                        <h3 class="text-green-800 text-lg font-bold mb-6">
                            Artifact Description
                        </h3>

                        <p class="mb-4">
                            {{ state.job.long_description }}
                        </p>
                    </div>
                </main>

                <!-- Sidebar -->
                <aside>
                    <!-- Author Info and Statistics this has to be fixed -->
                    <div class="bg-white p-6 rounded-lg shadow-md mb-6">
                        <h3 class="text-xl font-bold mb-4">Artifact Owner</h3>
                        <!-- <div class="text-2xl font-semibold mb-2">{{ state.job.authors[0]?.full_name }}</div>
                        <div class="text-lg mb-2">{{ state.job.authors[0]?.affiliation }}</div>
                        <div class="text-lg mb-4">{{ state.job.authors[0]?.email }}</div> -->

                        <div class="flex items-center mb-2">
                            <i class="fas fa-eye mr-2 text-lime-500"></i>
                            <span>Access Count: {{ state.job.access_count }}</span>
                        </div>
                        <div class="flex items-center mb-2">
                            <i class="fas fa-user-check mr-2 text-lime-500"></i>
                            <span>Unique Access Count: {{ state.job.unique_access_count }}</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-list-alt mr-2 text-lime-500"></i>
                            <span>Unique Cell Execution Count: {{ state.job.unique_cell_execution_count }}</span>
                        </div>
                    </div>

                    <!-- Manage -->
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <h3 class="text-xl font-bold mb-6">Manage Artifact</h3>
                        <RouterLink :to="`/jobs/edit/${state.job.uuid}`"
                            class="bg-lime-500 hover:bg-lime-600 text-white text-center font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline mt-4 block">
                            Update in GitHub
                        </RouterLink>
                        <button @click="deleteJob"
                            class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline mt-4 block">
                            Delete
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    </section>

    <!-- Show loading spinner while loading is true -->
    <div v-else class="text-center text-gray-500 py-6">
        <PulseLoader />
    </div>
</template>
