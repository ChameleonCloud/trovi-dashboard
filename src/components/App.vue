<script setup>
import Navbar from '@/components/Navbar.vue';
import Hero from '@/components/Hero.vue';
import HomeCards from '@/components/HomeCards.vue';
import Footer from '@/components/Footer.vue';
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <Navbar />
    <main class="flex-1">
      <Hero />
      <HomeCards />
    </main>
    <Footer />
  </div>
</template>


<!-- 
<template>
  <Navbar />
  <Hero />
  <HomeCards />
  </main>
  <Footer />

</template> -->