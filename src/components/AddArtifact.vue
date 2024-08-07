<script setup>
import { RouterLink } from 'vue-router';

const redirectToGithub = () => {
    // Replace with the actual GitHub login URL or your OAuth URL
    window.location.href = 'https://github.com/login/oauth/authorize?client_id=YOUR_CLIENT_ID';
};
</script>

<template>
    <section class="bg-green-50">
        <div class="container m-auto max-w-2xl py-24">
            <div class="bg-white px-6 py-8 mb-4 shadow-md rounded-md border m-4 md:m-0 text-center">
                <h2 class="text-3xl font-semibold mb-6">Add New Artifact</h2>
                <div class="flex flex-col space-y-4">
                    <!-- Add New Artifact from Source Button -->
                    <RouterLink to="/artifacts/add/source"
                        class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline">
                        Add New Artifact from Source
                    </RouterLink>

                    <!-- Add New Artifact from GitHub Button -->
                    <button @click="redirectToGithub"
                        class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline">
                        Add New Artifact from GitHub
                    </button>
                </div>
            </div>
        </div>
    </section>
</template>
