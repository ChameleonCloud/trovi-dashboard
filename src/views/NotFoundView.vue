<script setup>
import LinkButton from '@/components/LinkButton.vue'
import MainSection from '@/components/MainSection.vue'
</script>

<template>
  <MainSection>
    <h1 class="text-6xl font-bold mb-4 text-gray-900 dark:text-gray-100">404 Not Found</h1>
    <p class="text-xl mb-5 text-gray-700 dark:text-gray-300">
      This page does not exist yet, or you do not have permission to view it.
    </p>
    <LinkButton to="/"> Go Back </LinkButton>
  </MainSection>
</template>
