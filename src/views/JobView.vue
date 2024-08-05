<script setup>
import PulseLoader from 'vue-spinner/src/PulseLoader.vue';
import BackButton from '@/components/BackButton.vue';
import { reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const jobId = route.params.uuid;

const state = reactive({
    job: {
        long_description: '',
        created_at: '',
        updated_at: ''
    },
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
        state.job.long_description = response.data.long_description;
        state.job.created_at = response.data.created_at;
        state.job.updated_at = response.data.updated_at;
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
                    <!-- Artifact Description and Timestamps -->
                    <div class="bg-white p-6 rounded-lg shadow-md text-center md:text-left">
                        <h3 class="text-green-800 text-lg font-bold mb-6">
                            Artifact Description
                        </h3>
                        <p class="mb-4">
                            {{ state.job.long_description }}
                        </p>
                        <div class="text-gray-500 mt-4">
                            <p>Created At: {{ new Date(state.job.created_at).toLocaleDateString() }}</p>
                            <p>Last update: {{ new Date(state.job.updated_at).toLocaleDateString() }}</p>
                        </div>
                    </div>
                </main>

                <!-- Sidebar: Manage Actions -->
                <aside>
                    <div class="bg-white p-6 rounded-lg shadow-md mb-6">
                        <h3 class="text-xl font-bold mb-6">Manage Artifact</h3>
                        <RouterLink :to="`/jobs/edit/${jobId}`"
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
