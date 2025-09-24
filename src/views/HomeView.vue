<script setup>
import CardItem from '@/components/CardItem.vue'
import MainSection from '@/components/MainSection.vue'
import ArtifactList from '@/components/artifact/ArtifactList.vue'
</script>

<template>
  <section class="column justify-center items-center text-center q-pa-lg chameleon-header">
    <h1 class="text-h2 q-mb-md text-bold">A collection of shared artifacts</h1>
    <p class="text-subtitle1 q-mb-lg text-bold">An open platform for practical reproducibility.</p>
  </section>
  <MainSection>
    <div class="q-pa-md row items-start justify-center q-gutter-md">
      <CardItem title="Get Started" to="/artifacts" to_label="Explore Artifacts" class="col">
        Explore artifacts that users have shared on Trovi.
      </CardItem>
      <CardItem title="Learn More" to="/about" to_label="About" class="col">
        Learn more about the Trovi platform.
      </CardItem>
    </div>
  </MainSection>

  <ArtifactList :limit="6" :showButton="true" />
</template>
