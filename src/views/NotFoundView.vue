<script setup>
import MainSection from '@/components/MainSection.vue'
</script>

<template>
  <MainSection class="column justify-center items-center text-center q-pa-lg">
    <h1 class="text-h2 q-mb-md">404 Not Found</h1>
    <p class="text-subtitle1 q-mb-lg">
      This page does not exist yet, or you do not have permission to view it.
    </p>
    <q-btn to="/" color="primary" class="q-mb-md" label="Go Back" />
  </MainSection>
</template>
