<script setup>
import Hero from '@/components/Hero.vue';
import HomeCards from '@/components/HomeCards.vue';
import JobListings from '@/components/ArtifactListings.vue';
import SearchBar from '@/components/SearchBar.vue';
</script>

<template>
  <Hero />
  <SearchBar />
  <HomeCards />
  <JobListings :limit="6" :showButton="true" />
</template>
