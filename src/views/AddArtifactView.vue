<script setup>
import router from '@/router'
import { reactive } from 'vue'
import { useArtifactsStore } from '@/stores/artifact'
import { useAuthStore } from '@/stores/auth'
import MainSection from '@/components/MainSection.vue'
import { QSpinner, QInput, QBtn } from 'quasar'

const authStore = useAuthStore()
authStore.initKeycloak()

const artifactsStore = useArtifactsStore()

const form = reactive({
  githubRepo: '',
  loading: false,
})

const handleSubmit = async () => {
  form.loading = true
  try {
    const artifact = await artifactsStore.importArtifact(form.githubRepo)
    if (artifact) {
      router.push({ path: `/artifacts/${artifact.uuid}` })
    }
  } finally {
    form.loading = false
  }
}
</script>

<template>
  <MainSection>
    <q-card>
      <q-card-section>
        <form @submit.prevent="handleSubmit">
          <h2 class="text-h5 text-center q-mb-lg">Import Artifact</h2>

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
                Once your artifact is created, you can register further versions with Trovi under
                the <em>Edit</em> page.
              </li>
            </ol>
          </article>

          <q-input
            filled
            v-model="form.githubRepo"
            label="GitHub Repository URL"
            type="url"
            placeholder="https://github.com/owner/repo"
            :disable="form.loading"
            class="q-mb-md"
            required
          />

          <div v-if="form.loading" class="row justify-center q-my-md">
            <QSpinner size="40px" color="primary" />
          </div>

          <q-btn
            label="Add Artifact"
            color="primary"
            class="full-width"
            type="submit"
            :loading="form.loading"
          />
        </form>
      </q-card-section>
    </q-card>
  </MainSection>
</template>
