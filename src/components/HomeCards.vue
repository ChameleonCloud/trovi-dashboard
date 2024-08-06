<script setup>
import { RouterLink } from 'vue-router';
import Card from '@/components/Card.vue';
</script>

<template>
  <section class="py-4">
    <div class="container-xl lg:container m-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg">
        <Card bg="bg-gray-100">
          <h2 class="text-2xl font-bold">Learn more</h2>
          <p class="mt-2 mb-4">
            Get started with our collection of shared artifacts.
          </p>
          <RouterLink to="/jobs" class="inline-block bg-black text-white rounded-lg px-4 py-2 hover:bg-lime-700">
            Explore Artifacts
          </RouterLink>
        </Card>
        <Card bg="bg-gray-100">
          <h2 class="text-2xl font-bold">Get started</h2>
          <p class="mt-2 mb-4">
            Create a new artifact and share it with the community.
          </p>
          <RouterLink to="/jobs/add" class="inline-block bg-black text-white rounded-lg px-4 py-2 hover:bg-lime-700">
            Add New Artifact
          </RouterLink>
        </Card>
      </div>
    </div>
  </section>
</template>
