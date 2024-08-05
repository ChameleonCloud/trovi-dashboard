<!-- composition API -->
<script setup>
import logo from '@/assets/img/logo.png'
import { RouterLink, useRoute } from 'vue-router';
// get the path -> function below
const isActiveLink = (routePath) => {
  const route = useRoute();
  return route.path === routePath;
}
</script>

<template>
  <nav class="bg-stone-700 border-b bbg-stone-300">
    <div class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
      <div class="flex h-20 items-center justify-between">
        <div class="flex flex-1 items-center justify-center md:items-stretch md:justify-start">
          <!-- Logo -->

          <RouterLink class="flex flex-shrink-0 items-center mr-4" to="/">
            <img class="h-10 w-auto" :src="logo" alt="Trovi" />
            <span class="hidden md:block text-white text-2xl font-bold ml-2">Trovi</span>
          </RouterLink>

          <div class="md:ml-auto">
            <div class="flex space-x-2">
              <RouterLink to="/"
                :class="[isActiveLink('/') ? 'bg-zinc-800' : 'hover:bg-gray-900 hover:text-white', 'text-white', 'px-3', 'py-2', 'rounded-md']">
                Home
              </RouterLink>
              <RouterLink to="/jobs"
                :class="[isActiveLink('/jobs') ? 'bg-zinc-800' : 'hover:bg-gray-900 hover:text-white', 'text-white', 'px-3', 'py-2', 'rounded-md']">
                Explore <!-- Jobs -->
              </RouterLink>
              <!-- <RouterLink to="/jobs/add" -->
              <RouterLink to="/NotFoundView"
                :class="[isActiveLink('/NotFoundView') ? 'bg-zinc-800' : 'hover:bg-gray-900 hover:text-white', 'text-white', 'px-3', 'py-2', 'rounded-md']">

                <!-- :class="[isActiveLink('/jobs/add') ? 'bg-zinc-800' : 'hover:bg-gray-900 hover:text-white', 'text-white', -->
                <!-- 'px-3', 'py-2', 'rounded-md']"> -->
                Docs <!-- Add Job -->
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>

</template>