<script setup>
import { onMounted, ref } from 'vue'
import { Notify } from 'quasar'
import MainSection from '@/components/MainSection.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const profile = ref(null)
const noEmail = ref(false)

onMounted(async () => {
  try {
    profile.value = await authStore.fetchProfile()
  } catch (err) {
    // Trovi only learns an email address from the login token
    noEmail.value = err.response?.status === 404
    if (!noEmail.value) {
      Notify.create({ type: 'negative', message: `Failed to load settings: ${err.message}` })
    }
  }
})

async function setCommentNotifications(value) {
  try {
    profile.value = await authStore.updateProfile({ comment_notifications: value })
  } catch (err) {
    Notify.create({ type: 'negative', message: `Failed to save settings: ${err.message}` })
  }
}
</script>

<template>
  <MainSection>
    <q-card class="q-mx-auto" style="max-width: 640px">
      <q-card-section>
        <h1 class="text-h5 q-my-none">Settings</h1>
      </q-card-section>
      <q-separator />
      <q-card-section v-if="noEmail" class="text-caption">
        Trovi can't send you email because your Chameleon account has no email address.
      </q-card-section>
      <q-item v-else-if="profile" tag="label" class="q-py-md">
        <q-item-section>
          <q-item-label>Comment notifications</q-item-label>
          <q-item-label caption>
            Email {{ profile.email }} when someone comments on your artifacts or replies to your
            comments.
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-toggle
            :model-value="profile.comment_notifications"
            @update:model-value="setCommentNotifications"
          />
        </q-item-section>
      </q-item>
    </q-card>
  </MainSection>
</template>
