<script setup>
import { computed, reactive, watch } from 'vue'
import { Dialog } from 'quasar'
import { useArtifactsStore } from '@/stores/artifact'
import { useAuthStore } from '@/stores/auth'
import { parseUrn } from '@/util'

const props = defineProps({ artifact: Object, version_slug: String })
const emit = defineEmits(['commented'])

const artifactsStore = useArtifactsStore()
const authStore = useAuthStore()

const state = reactive({
  verifications: [],
  saving: false,
})

const forVersion = computed(() =>
  state.verifications.filter((v) => v.version === props.version_slug),
)
const myAnswer = computed(
  () => forVersion.value.find((v) => v.user === authStore.userInfo?.userUrn)?.verified,
)
const isAuthor = computed(() =>
  props.artifact.roles.some((role) => role.user === authStore.userInfo?.userUrn),
)

async function loadVerifications() {
  try {
    state.verifications = await artifactsStore.fetchVerifications(
      props.artifact.uuid,
      new URLSearchParams(window.location.search).get('sharing_key'),
    )
  } catch (error) {
    console.error('Error fetching verifications', error)
  }
}

watch(() => props.artifact.uuid, loadVerifications, { immediate: true })

async function verify(verified) {
  state.saving = true
  const saved = await artifactsStore.createVerification(props.artifact.uuid, {
    version: props.version_slug,
    verified,
  })
  state.saving = false
  if (!saved) return
  await loadVerifications()
  if (!verified && props.artifact.comments_enabled) promptComment()
}

function promptComment() {
  Dialog.create({
    title: 'What went wrong?',
    message: 'Leave a comment to let the authors and other users know what you ran into.',
    prompt: { model: '', type: 'textarea' },
    ok: { label: 'Comment' },
    cancel: { label: 'Skip' },
  }).onOk(async (description) => {
    if (!description.trim()) return
    const comment = { description, version: props.version_slug }
    if (await artifactsStore.createComment(props.artifact.uuid, comment)) emit('commented')
  })
}
</script>

<template>
  <div v-if="version_slug" class="q-mb-md">
    <h2 class="text-h6 text-primary">Verification</h2>

    <q-btn
      v-if="!authStore.isAuthenticated"
      flat
      color="primary"
      label="Log in to verify"
      class="full-width"
      @click="authStore.login()"
    />
    <template v-else-if="!isAuthor">
      <div class="text-body2 q-mb-sm">Verify this artifact works when executed.</div>
      <q-btn
        class="full-width q-mb-sm"
        icon="verified"
        label="Successfully verified"
        color="positive"
        :outline="myAnswer !== true"
        :loading="state.saving"
        @click="verify(true)"
      />
      <q-btn
        class="full-width"
        icon="report_problem"
        label="Failure to verify"
        color="negative"
        :outline="myAnswer !== false"
        :loading="state.saving"
        @click="verify(false)"
      />
    </template>

    <q-list v-if="forVersion.length" dense class="q-mt-sm">
      <q-item v-for="v in forVersion" :key="v.user" class="q-px-none">
        <q-item-section side>
          <q-icon
            :name="v.verified ? 'verified' : 'report_problem'"
            :color="v.verified ? 'positive' : 'negative'"
            size="xs"
          >
            <q-tooltip>{{ v.verified ? 'Verified' : 'Unable to verify' }}</q-tooltip>
          </q-icon>
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-body2">{{ parseUrn(v.user).username }}</q-item-label>
          <q-item-label caption>{{ v.timestamp }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
    <div v-else class="text-body2 text-grey-7 q-mt-sm">No one has verified this version yet.</div>
  </div>
</template>
