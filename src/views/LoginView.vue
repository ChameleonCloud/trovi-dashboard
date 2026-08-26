<script setup>
import { useAuthStore } from '@/stores/auth'
import router from '@/router'
import MainSection from '@/components/MainSection.vue'

const authStore = useAuthStore()

// Landing here means "log me in". Return home, not here, which would loop.
authStore.restoreSession().then((authenticated) => {
  if (authenticated) {
    router.replace({ path: '/' })
  } else {
    authStore.login(router.resolve('/').href)
  }
})
</script>

<template>
  <MainSection>
    <p>Please wait while you are redirected to Chameleon's Login server</p>
  </MainSection>
</template>
