<script setup>
import { RouterLink } from 'vue-router';
import Card from '@/components/Card.vue';
</script>

<template>
  <section class="py-4">
    <div class="container-xl lg:container m-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg">
        <Card>
          <h2 class="text-2xl font-bold">Get Started</h2>
          <p class="mt-2 mb-4">
            Explore artifact that users have shared on Trovi.
          </p>
          <RouterLink to="/artifacts" class="inline-block bg-black text-white rounded-lg px-4 py-2 hover:bg-lime-700">
            Explore Artifacts
          </RouterLink>
        </Card>
        <Card>
          <h2 class="text-2xl font-bold">Learn more</h2>
          <p class="mt-2 mb-4">
            Learn more about the Trovi platform.
          </p>
          <RouterLink to="/about"
            class="inline-block bg-black text-white rounded-lg px-4 py-2 hover:bg-lime-700">
            About
          </RouterLink>
        </Card>
      </div>
    </div>
  </section>
</template>
