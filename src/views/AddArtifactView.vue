<script setup>
import router from '@/router'
import { reactive, ref, watch } from 'vue'
import { useArtifactsStore } from '@/stores/artifact'
import { useAuthStore } from '@/stores/auth'
import MainSection from '@/components/MainSection.vue'
import { Notify, QSpinner, QInput, QBtn, QSelect, QTabs, QTab, QTabPanels, QTabPanel } from 'quasar'
import { useRoute } from 'vue-router'

const authStore = useAuthStore()
authStore.initKeycloak()

const artifactsStore = useArtifactsStore()

const route = useRoute()

// Default to 'import', but override if query param exists
const tab = ref(route.query.mode || 'import')
watch(tab, (newTab) => {
  router.replace({ query: { ...route.query, mode: newTab } })
})

// GitHub form
const githubForm = reactive({
  githubRepo: '',
  loading: false,
})

// Manual form
const manualForm = reactive({
  title: '',
  short_description: '',
  long_description: '',
  visibility: 'private',
  tags: [],
  authors: [],
  loading: false,
})

const handleGithubSubmit = async () => {
  githubForm.loading = true
  try {
    const artifact = await artifactsStore.importArtifact(githubForm.githubRepo)
    if (artifact) router.push({ path: `/artifacts/${artifact.uuid}` })
  } finally {
    githubForm.loading = false
  }
}

const handleManualSubmit = async () => {
  if (manualForm.authors.length === 0) {
    Notify.create({
      type: 'negative',
      message: 'Please add at least one author.',
    })
    return
  }

  manualForm.loading = true
  try {
    const artifact = await artifactsStore.createArtifact({
      title: manualForm.title,
      short_description: manualForm.short_description,
      long_description: manualForm.long_description,
      visibility: manualForm.visibility,
      tags: manualForm.tags,
      authors: manualForm.authors,
    })
    if (artifact) router.push({ path: `/artifacts/${artifact.uuid}` })
  } finally {
    manualForm.loading = false
  }
}

const addAuthor = () => {
  manualForm.authors.push({ full_name: '', affiliation: '', email: '' })
}

artifactsStore.fetchTags()
</script>

<template>
  <MainSection>
    <q-card>
      <q-card-section>
        <q-tabs v-model="tab" dense class="q-mb-md">
          <q-tab name="import" label="Import from GitHub" />
          <q-tab name="manual" label="Manual Entry" />
        </q-tabs>

        <q-tab-panels v-model="tab" animated>
          <!-- GitHub import -->
          <q-tab-panel name="import">
            <form @submit.prevent="handleGithubSubmit">
              <h2 class="text-h5 text-center q-mb-lg">Import Artifact from GitHub</h2>
              <article class="q-mb-lg">
                <p>
                  To import an artifact, you must provide a GitHub repository URL. This repository
                  should be configured with a <code>trovi.json</code>, which contains the artifact's
                  metadata.
                </p>
                <p>Detailed instructions:</p>
                <ol>
                  <li>Create a public repository on GitHub.</li>
                  <li>
                    Create a <code>trovi.json</code> file, either manually or via
                    <a
                      href="https://github.com/ChameleonCloud/troviclient?tab=readme-ov-file#trovi-artifact-generate"
                      target="_blank"
                      rel="noopener noreferrer"
                      >the Trovi CLI tool</a
                    >.
                  </li>
                  <li>Upload <code>trovi.json</code> to the root of your git repository.</li>
                  <li>
                    Copy and paste the GitHub clone URL into the input below, then click
                    <em>Add Artifact</em>.
                  </li>
                  <li>
                    Once your artifact is created, you can register further versions with Trovi
                    under the <em>Edit</em> page.
                  </li>
                </ol>
              </article>
              <q-input
                filled
                v-model="githubForm.githubRepo"
                label="GitHub Repository URL"
                type="url"
                placeholder="https://github.com/owner/repo"
                :disable="githubForm.loading"
                class="q-mb-md"
                required
              />
              <div v-if="githubForm.loading" class="row justify-center q-my-md">
                <QSpinner size="40px" color="primary" />
              </div>
              <q-btn
                label="Add Artifact"
                color="primary"
                class="full-width"
                type="submit"
                :loading="githubForm.loading"
              />
            </form>
          </q-tab-panel>

          <!-- Manual entry -->
          <q-tab-panel name="manual">
            <form @submit.prevent="handleManualSubmit">
              <h2 class="text-h5 text-center q-mb-lg">Create Artifact Manually</h2>
              <article class="q-mb-lg">
                <p>
                  You can create an artifact manually by filling out the form below. You will need
                  to provide at least one author.
                </p>
                <p>
                  After creating the artifact, you can register further versions from Git under the
                  <em>Edit</em> page.
                </p>
              </article>
              <q-input
                v-model="manualForm.title"
                label="Title"
                dense
                class="q-mb-sm"
                :rules="[(val) => val.length <= 140 || 'Please use maximum 140 characters']"
                hint="Max 140 characters"
              />
              <q-input
                v-model="manualForm.short_description"
                type="textarea"
                autogrow
                label="Short Description"
                dense
                class="q-mb-sm"
                :rules="[(val) => val.length <= 200 || 'Please use maximum 200 characters']"
                hint="Max 200 characters"
              />
              <q-input
                filled
                type="textarea"
                autogrow
                v-model="manualForm.long_description"
                label="Long Description"
                class="q-mb-md"
              />
              <q-select
                filled
                v-model="manualForm.tags"
                :options="artifactsStore.tags"
                label="Tags"
                multiple
                use-chips
                dense
                class="q-mb-md"
              />
              <q-select
                filled
                v-model="manualForm.visibility"
                :options="['public', 'private']"
                label="Visibility"
                dense
                class="q-mb-md"
              />

              <h3 class="text-h6 q-mb-sm">Authors</h3>
              <div
                v-for="(author, index) in manualForm.authors"
                :key="index"
                class="row items-center q-gutter-sm q-mb-sm"
              >
                <q-input v-model="author.full_name" label="Full Name" dense class="col" required />
                <q-input v-model="author.affiliation" label="Affiliation" dense class="col" />
                <q-input v-model="author.email" type="email" label="Email" dense class="col" />
                <q-btn
                  color="negative"
                  flat
                  icon="delete"
                  @click="manualForm.authors.splice(index, 1)"
                  round
                  dense
                />
              </div>
              <q-btn label="Add Author" color="primary" @click="addAuthor" class="q-mb-md" />

              <div v-if="manualForm.loading" class="row justify-center q-my-md">
                <QSpinner size="40px" color="primary" />
              </div>

              <q-btn
                label="Create Artifact"
                color="primary"
                class="full-width"
                type="submit"
                :loading="manualForm.loading"
              />
            </form>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>
    </q-card>
  </MainSection>
</template>
