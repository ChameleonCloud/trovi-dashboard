<script setup>
import Hero from '@/components/Hero.vue';
import HomeCards from '@/components/HomeCards.vue';
import JobListing from '@/components/JobListings.vue';

</script>
<template>
    <Hero />
    <HomeCards />
    <job-listing :limit="3" :showButton="true" />
</template>
