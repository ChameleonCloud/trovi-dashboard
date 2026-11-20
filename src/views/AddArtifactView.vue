<script setup>
import router from '@/router'
import { computed, reactive, ref, watch } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useArtifactsStore } from '@/stores/artifact'
import { useAuthStore } from '@/stores/auth'
import MainSection from '@/components/MainSection.vue'
import FormSection from '@/components/FormSection.vue'
import GitRefInput from '@/components/GitRefInput.vue'
import LaunchOptionsEditor from '@/components/artifact/LaunchOptionsEditor.vue'
import { gitToUrn, launchOptionsToSetup, newLaunchOption } from '@/util'
import { Notify } from 'quasar'

const artifactsStore = useArtifactsStore()
const authStore = useAuthStore()

const VISIBILITY = [
  { label: 'Private', value: 'private', icon: 'lock' },
  { label: 'Public', value: 'public', icon: 'public' },
]
const VISIBILITY_HINTS = {
  private: 'Only you, and people you share it with, can see it.',
  public: 'Anyone can find and launch it on Trovi.',
}

const form = reactive({
  gitUrl: '',
  gitRef: null,
  title: '',
  short_description: '',
  long_description: '',
  tags: [],
  visibility: 'private',
  authors: [
    {
      full_name: authStore.userInfo.name || '',
      affiliation: '',
      email: authStore.userInfo.email || '',
    },
  ],
  launchOptions: [newLaunchOption()],
  loading: false,
  importing: false,
})

const required = (val) => !!val?.trim() || 'Required'

const descriptionTab = ref('write')
const descriptionMarkup = computed(() => DOMPurify.sanitize(marked(form.long_description)))

const repoName = (url) => url?.match(/([^/:]+?)(?:\.git)?\/*$/)?.[1] || ''

// Names the artifact after the repository, until the user names it
watch(
  () => form.gitUrl,
  (url, old) => {
    if (form.title === repoName(old)) form.title = repoName(url)
  },
)

const githubRepo = computed(
  () => form.gitUrl?.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?\/*$/i)?.[1],
)
const hasTroviJson = ref(false)
watch(githubRepo, async (repo) => {
  hasTroviJson.value = false
  if (!repo) return
  try {
    const res = await fetch(`https://raw.githubusercontent.com/${repo}/HEAD/trovi.json`, {
      method: 'HEAD',
    })
    // The URL may have changed while this was checked
    hasTroviJson.value = res.ok && repo === githubRepo.value
  } catch {
    // GitHub is unreachable, so there is no import to offer
  }
})

const importTroviJson = async () => {
  form.importing = true
  try {
    const artifact = await artifactsStore.importArtifact(form.gitUrl)
    if (artifact) router.push({ path: `/artifacts/${artifact.uuid}` })
  } finally {
    form.importing = false
  }
}

const submit = async () => {
  if (form.gitUrl && !form.gitRef) {
    Notify.create({ type: 'negative', message: 'Please select a branch, tag or commit.' })
    return
  }

  form.loading = true
  try {
    const artifact = await artifactsStore.createArtifact({
      title: form.title,
      short_description: form.short_description,
      long_description: form.long_description,
      visibility: form.visibility,
      tags: form.tags,
      authors: form.authors,
      // The first version, made with the artifact
      ...(form.gitUrl && {
        version: {
          contents: { urn: gitToUrn(form.gitUrl, form.gitRef) },
          environment_setup: launchOptionsToSetup(form.launchOptions),
        },
      }),
    })
    if (artifact) router.push({ path: `/artifacts/${artifact.uuid}` })
  } finally {
    form.loading = false
  }
}

artifactsStore.fetchTags()
</script>

<template>
  <MainSection>
    <q-form class="q-mx-auto" style="max-width: 960px" @submit="submit">
      <h2 class="text-h5 q-mt-none q-mb-xs">Create an artifact</h2>
      <p class="text-grey-8 q-mb-lg">
        Share an experiment's code and data, and how others can launch it.
      </p>

      <FormSection
        :step="1"
        title="Git repository"
        caption="Optional. The repository with the experiment's code, notebooks and data. The commit you pick becomes the artifact's first version."
      >
        <q-banner dense rounded class="bg-blue-1 q-mb-md">
          <template v-slot:avatar>
            <q-icon name="info" color="primary" />
          </template>
          Have a <code>trovi.json</code>? Enter its GitHub repository, and the artifact can be
          created from it (<a
            href="https://chameleoncloud.readthedocs.io/en/latest/technical/sharing.html#packaging-shared-artifacts"
            target="_blank"
            rel="noopener noreferrer"
            >learn more</a
          >).
        </q-banner>
        <GitRefInput v-model:url="form.gitUrl" v-model:git-ref="form.gitRef" />
        <q-banner v-if="hasTroviJson" rounded class="bg-green-1 q-mb-md">
          <template v-slot:avatar>
            <q-icon name="check_circle" color="positive" />
          </template>
          This repository has a <code>trovi.json</code>. Create the artifact from it, with the
          details, authors and launch options it has on the default branch. Or fill in the form
          below yourself.
          <template v-slot:action>
            <q-btn
              color="primary"
              unelevated
              no-caps
              label="Create from trovi.json"
              :loading="form.importing"
              @click="importTroviJson"
            />
          </template>
        </q-banner>
        <p v-if="!form.gitUrl" class="text-caption text-grey-8 q-mb-none">
          No repository? Leave this blank, and add a version later.
        </p>
        <template v-else>
          <h4 class="text-subtitle1 q-mt-md q-mb-xs">How users launch it</h4>
          <p class="text-caption text-grey-8">
            Each launch option is a button on the artifact page.
          </p>
          <LaunchOptionsEditor v-model="form.launchOptions" />
        </template>
      </FormSection>

      <FormSection :step="2" title="Details">
        <q-input
          v-model="form.title"
          label="Title *"
          filled
          maxlength="140"
          counter
          :rules="[required]"
          class="q-mb-sm"
        />
        <q-input
          v-model="form.short_description"
          label="Short description *"
          filled
          autogrow
          maxlength="200"
          counter
          :rules="[required]"
          class="q-mb-sm"
        />
        <div class="row items-center justify-between q-mb-xs">
          <span class="text-subtitle2">Description</span>
          <q-btn-toggle
            v-model="descriptionTab"
            :options="[
              { label: 'Write', value: 'write' },
              { label: 'Preview', value: 'preview' },
            ]"
            flat
            dense
            no-caps
            toggle-color="primary"
          />
        </div>
        <q-input
          v-if="descriptionTab === 'write'"
          v-model="form.long_description"
          type="textarea"
          filled
          autogrow
          maxlength="5000"
          counter
          hint="Markdown"
          input-style="min-height: 8em"
          class="q-mb-md"
        />
        <div v-else class="rounded-borders bg-grey-2 q-pa-md q-mb-lg" style="min-height: 8em">
          <div v-if="form.long_description" v-html="descriptionMarkup"></div>
          <span v-else class="text-grey-7">Nothing to preview.</span>
        </div>
        <div class="row q-col-gutter-md">
          <q-select
            v-model="form.tags"
            :options="artifactsStore.tags"
            label="Tags"
            filled
            multiple
            use-chips
            class="col-12 col-md-8"
          />
          <div class="col-12 col-md-4">
            <q-btn-toggle
              v-model="form.visibility"
              :options="VISIBILITY"
              spread
              no-caps
              unelevated
              toggle-color="primary"
            />
            <p class="text-caption text-grey-7 q-mt-xs q-mb-none">
              {{ VISIBILITY_HINTS[form.visibility] }}
            </p>
          </div>
        </div>

        <h4 class="text-subtitle1 q-mt-lg q-mb-sm">Authors</h4>
        <div
          v-for="(author, index) in form.authors"
          :key="index"
          class="row items-start q-col-gutter-sm q-mb-sm"
        >
          <q-input
            v-model="author.full_name"
            label="Full name *"
            filled
            dense
            :rules="[required]"
            hide-bottom-space
            class="col"
          />
          <q-input v-model="author.affiliation" label="Affiliation" filled dense class="col" />
          <q-input v-model="author.email" type="email" label="Email" filled dense class="col" />
          <div class="col-auto">
            <q-btn
              flat
              round
              dense
              color="negative"
              icon="delete"
              @click="form.authors.splice(index, 1)"
            >
              <q-tooltip>Remove author</q-tooltip>
            </q-btn>
          </div>
        </div>
        <p v-if="!form.authors.length" class="text-caption text-negative">
          Add at least one author.
        </p>
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          icon="add"
          label="Add author"
          @click="form.authors.push({ full_name: '', affiliation: '', email: '' })"
        />
      </FormSection>

      <div class="row justify-end items-center q-gutter-md">
        <span class="text-caption text-grey-7">You can change all of this later.</span>
        <q-btn
          type="submit"
          color="primary"
          unelevated
          label="Create artifact"
          :loading="form.loading"
          :disable="!form.authors.length"
        />
      </div>
    </q-form>
  </MainSection>
</template>
