<script setup>
import CardItem from '@/components/CardItem.vue'
import MainSection from './MainSection.vue'
</script>

<template>
  <MainSection>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg">
      <CardItem title="Get Started" to="/artifacts" to_label="Explore Artifacts">
        Explore artifacts that users have shared on Trovi.
      </CardItem>

      <CardItem title="Learn More" to="/about" to_label="About">
        Learn more about the Trovi platform.
      </CardItem>
    </div>
  </MainSection>
</template>
