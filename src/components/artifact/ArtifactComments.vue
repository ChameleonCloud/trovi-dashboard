<script setup>
import { computed, reactive, watch } from 'vue'
import { useArtifactsStore } from '@/stores/artifact'
import { useAuthStore } from '@/stores/auth'
import ArtifactCommentThread from '@/components/artifact/ArtifactCommentThread.vue'

const props = defineProps({ artifact: Object })

const artifactsStore = useArtifactsStore()
const authStore = useAuthStore()

const state = reactive({
  comments: [],
  draft: '',
  posting: false,
})

const byParent = computed(() => {
  const map = new Map()
  state.comments.forEach((comment) => {
    if (!map.has(comment.parent)) map.set(comment.parent, [])
    map.get(comment.parent).push(comment)
  })
  return map
})

const roots = computed(() => byParent.value.get(null) ?? [])

async function loadComments() {
  try {
    state.comments = await artifactsStore.fetchComments(
      props.artifact.uuid,
      new URLSearchParams(window.location.search).get('sharing_key'),
    )
  } catch (error) {
    console.error('Error fetching comments', error)
  }
}

watch(() => props.artifact.uuid, loadComments, { immediate: true })

async function postComment() {
  state.posting = true
  if (await artifactsStore.createComment(props.artifact.uuid, { description: state.draft })) {
    state.draft = ''
    await loadComments()
  }
  state.posting = false
}
</script>

<template>
  <div class="q-mb-lg">
    <h2 class="text-h6 text-primary q-mb-md">Comments</h2>

    <div v-if="authStore.isAuthenticated" class="q-mb-lg">
      <q-input
        v-model="state.draft"
        type="textarea"
        autogrow
        outlined
        label="Add a comment"
        hint="Markdown supported"
        :maxlength="5000"
      />
      <div class="row justify-end q-mt-sm">
        <q-btn
          color="primary"
          label="Comment"
          :disable="!state.draft.trim()"
          :loading="state.posting"
          @click="postComment"
        />
      </div>
    </div>
    <q-btn
      v-else
      flat
      color="primary"
      label="Log in to comment"
      class="q-mb-md"
      @click="authStore.login()"
    />

    <ArtifactCommentThread
      v-for="comment in roots"
      :key="comment.id"
      :comment="comment"
      :byParent="byParent"
      :artifact="artifact"
      @changed="loadComments"
    />
    <div v-if="!roots.length" class="text-grey-6">No comments yet.</div>
  </div>
</template>
