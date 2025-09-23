<script setup>
import { useAuthStore } from '@/stores/auth'
import router from '@/router'
import MainSection from '@/components/MainSection.vue'

const authStore = useAuthStore()
if (!authStore.isAuthenticated) {
  authStore.initKeycloak().then(() => {
    router.go(-1)
  })
} else {
  authStore.logout().then(() => {
    router.go(-1)
  })
}
</script>

<template>
  <MainSection>
    <p>Please wait while you are redirected to Chameleon's Login server</p>
  </MainSection>
</template>
