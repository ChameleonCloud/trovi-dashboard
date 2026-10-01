<script setup>
import { computed, reactive } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { Dialog } from 'quasar'
import { useArtifactsStore } from '@/stores/artifact'
import { useAuthStore } from '@/stores/auth'
import { parseUrn } from '@/util'

const props = defineProps({
  comment: Object,
  byParent: Map,
  artifact: Object,
})
const emit = defineEmits(['changed'])

const artifactsStore = useArtifactsStore()
const authStore = useAuthStore()

const state = reactive({
  replying: false,
  editing: false,
  draft: '',
  saving: false,
})

// A removed comment is served as a stub: structure only, no body or author
const isStub = computed(() => props.comment.description === null)
const placeholder = computed(() => (props.comment.deleted ? '[deleted]' : '[flagged]'))
const author = computed(() => (props.comment.user ? parseUrn(props.comment.user).username : ''))
const body = computed(() =>
  isStub.value ? '' : DOMPurify.sanitize(marked(props.comment.description)),
)
const replies = computed(() => props.byParent.get(props.comment.id) ?? [])
const isAuthor = computed(() => props.comment.user === authStore.userInfo?.userUrn)
const canModerate = computed(() => props.artifact.computed.canEditRoles())

function openEditor(editing) {
  state.editing = editing
  state.replying = !editing
  state.draft = editing ? props.comment.description : ''
}

function closeEditor() {
  state.editing = false
  state.replying = false
}

async function save() {
  state.saving = true
  const { uuid } = props.artifact
  const saved = state.editing
    ? await artifactsStore.updateComment(uuid, props.comment.id, state.draft)
    : await artifactsStore.createComment(uuid, {
        description: state.draft,
        parent: props.comment.id,
      })
  state.saving = false
  if (saved) {
    closeEditor()
    emit('changed')
  }
}

function confirmDelete() {
  Dialog.create({
    title: 'Confirm Deletion',
    message:
      'Are you sure you want to delete this comment? ' +
      'Its text is removed, but any replies to it are kept.',
    persistent: true,
    ok: { label: 'Delete', color: 'negative' },
    cancel: { label: 'Cancel' },
  }).onOk(async () => {
    if (await artifactsStore.deleteComment(props.artifact.uuid, props.comment.id)) {
      emit('changed')
    }
  })
}

async function review(decision, reason) {
  if (await artifactsStore.reviewComment(props.artifact.uuid, props.comment.id, decision, reason)) {
    emit('changed')
  }
}

function confirmReject() {
  Dialog.create({
    title: 'Flag Comment',
    message: 'Optionally, tell the author why. Only they and artifact admins will see this.',
    prompt: { model: '', type: 'textarea' },
    persistent: true,
    ok: { label: 'Flag', color: 'negative' },
    cancel: { label: 'Cancel' },
  }).onOk((reason) => review('rejected', reason))
}
</script>

<template>
  <div class="q-mb-md">
    <div class="row items-center q-gutter-x-sm">
      <span v-if="author" class="text-subtitle2">{{ author }}</span>
      <span class="text-caption">{{ comment.created_at }}</span>
      <span v-if="comment.updated_at" class="text-caption">(edited)</span>
      <q-badge
        v-if="!isStub && comment.decision !== 'approved'"
        :color="comment.decision === 'rejected' ? 'negative' : 'warning'"
        :label="comment.decision"
      />
    </div>
    <div
      v-if="comment.decision !== 'approved' && comment.decision_comment"
      class="text-caption text-negative"
    >
      Reason: {{ comment.decision_comment }}
    </div>

    <div v-if="isStub" class="text-body2 text-grey-6">{{ placeholder }}</div>
    <div v-else-if="!state.editing" class="comment-body text-body2" v-html="body"></div>

    <div v-if="state.replying || state.editing" class="q-mt-sm">
      <q-input
        v-model="state.draft"
        type="textarea"
        autogrow
        outlined
        dense
        autofocus
        :label="state.editing ? 'Edit comment' : 'Reply'"
        hint="Markdown supported"
        :maxlength="5000"
      />
      <div class="row justify-end q-gutter-x-sm q-mt-sm">
        <q-btn flat label="Cancel" @click="closeEditor" />
        <q-btn
          color="primary"
          :label="state.editing ? 'Save' : 'Reply'"
          :disable="!state.draft.trim()"
          :loading="state.saving"
          @click="save"
        />
      </div>
    </div>
    <div v-else-if="authStore.isAuthenticated && !isStub" class="row q-gutter-x-xs">
      <q-btn flat dense size="sm" label="Reply" @click="openEditor(false)" />
      <q-btn v-if="isAuthor" flat dense size="sm" label="Edit" @click="openEditor(true)" />
      <q-btn
        v-if="isAuthor || canModerate"
        flat
        dense
        size="sm"
        color="negative"
        label="Delete"
        @click="confirmDelete"
      />
      <template v-if="canModerate">
        <q-btn
          v-if="comment.decision !== 'approved'"
          flat
          dense
          size="sm"
          color="positive"
          label="Approve"
          @click="review('approved')"
        />
        <q-btn
          v-if="comment.decision !== 'rejected'"
          flat
          dense
          size="sm"
          label="Flag"
          @click="confirmReject"
        />
      </template>
    </div>

    <div v-if="replies.length" class="comment-replies q-mt-sm q-pl-md">
      <ArtifactCommentThread
        v-for="reply in replies"
        :key="reply.id"
        :comment="reply"
        :byParent="byParent"
        :artifact="artifact"
        @changed="emit('changed')"
      />
    </div>
  </div>
</template>

<style scoped>
.comment-body :deep(p:last-child) {
  margin-bottom: 0;
}

.comment-replies {
  border-left: 2px solid rgba(127, 127, 127, 0.3);
}
</style>
