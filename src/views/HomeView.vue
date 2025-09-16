<script setup>
import HomeCards from '@/components/HomeCards.vue'
import ArtifactList from '@/components/artifact/ArtifactList.vue'
</script>

<template>
  <section class="bg-lime-600 py-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div class="text-center">
        <h1 class="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
          A collection of shared artifacts
        </h1>
        <p class="my-4 text-xl text-white">An open platform for practical reproducibility.</p>
      </div>
    </div>
  </section>
  <HomeCards />
  <ArtifactList :limit="6" :showButton="true" />
</template>
