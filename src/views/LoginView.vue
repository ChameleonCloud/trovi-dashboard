<script setup>
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

const authStore = useAuthStore()
if (!authStore.isAuthenticated) {
  authStore.initKeycloak().then((_res) => {
    router.go(-1)
  })
} else {
  authStore.logout().then((_res) => {
    router.go(-1)
  })
}
</script>

<template>
  <section class="bg-green-50">
    <div class="container m-auto max-w-2xl py-24">
      <p>Please wait while you are redirected to Chameleon's Login server</p>
    </div>
  </section>
</template>
