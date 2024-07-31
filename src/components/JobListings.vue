<script setup>
import { RouterLink } from 'vue-router';
import JobListing from './JobListing.vue';
// import jobsData from '@/jobs.json';
// both we can use ref or reactive. I'll stick with ref() because it can take both objects or primitives
// import { ref, defineProps, onMounted } from 'vue';
import { reactive, defineProps, onMounted } from 'vue';
import axios from 'axios';

defineProps({
    limit: Number,
    showButton: {
        type: Boolean,
        default: false
    }
})

// bring it reactive and pass an object
const state = reactive({
    // jobs: [], empty array here
    jobs: [],
    isloading: true
})

onMounted(async () => {
    try {
        const response = await axios.get('http://localhost:2000/jobs');
        state.jobs = response.data;
    } catch (error) {
        console.error('Error fetching jobs', error);
    } finally {
        state.isloading = false;
    }
}
);

// console.log(jobs.value);
</script>

<template>
    <section class="bg-blue-50 px-4 py-10">
        <div class="container-xl lg:container m-auto">
            <h2 class="text-3xl font-bold text-green-500 mb-6 text-center">
                Browse Jobs
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Iterate over jobs array -->
                <JobListing v-for="job in state.jobs.slice(0, limit || state.jobs.length)" :key="job.id" :job="job" />
            </div>
        </div>
    </section>

    <section v-if="showButton" class="m-auto max-w-lg my-10 px-6">
        <RouterLink to="/jobs" class="block bg-black text-white text-center py-4 px-6 rounded-xl hover:bg-gray-700">
            View All Jobs
        </RouterLink>
    </section>
</template>