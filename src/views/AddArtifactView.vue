<script setup>
import PulseLoader from 'vue-spinner/src/PulseLoader.vue'
import router from '@/router'
import { reactive } from 'vue'
import { useArtifactsStore } from '@/stores/artifact'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
authStore.initKeycloak()

const artifactsStore = useArtifactsStore()

const form = reactive({
  githubRepo: '',
  loading: false,
})

const handleSubmit = async () => {
  form.loading = true
  let artifact = await artifactsStore.importArtifact(form.githubRepo)
  form.loading = false
  if (artifact) {
    router.push({ path: `/artifacts/${artifact.uuid}` })
  }
}
</script>

<template>
  <section class="bg-green-50">
    <div class="container m-auto max-w-2xl py-24">
      <div class="bg-white px-6 py-8 mb-4 shadow-md rounded-md border m-4 md:m-0">
        <form @submit.prevent="handleSubmit">
          <h2 class="text-3xl text-center font-semibold mb-6">Import Artifact</h2>

          <article class="prose">
            <p>
              To import an artifact, you must provide a GitHub repository URL. This repository
              should be configured with a <code>trovi.json</code>, which contains the artifact's
              metadata.
            </p>
            <p>Detailed instructions:</p>
            <ol class="list-decimal list-inside">
              <li>Create a public repository on GitHub.</li>
              <li>
                Create a <code>trovi.json</code> file, either manually of via
                <a
                  href="https://github.com/ChameleonCloud/troviclient?tab=readme-ov-file#trovi-artifact-generate"
                  >the Trovi CLI tool</a
                >.
              </li>
              <li>Upload <code>trovi.json</code> to the root of your git repository.</li>
              <li>
                Copy and paste the GitHub clone URL to the input below, and click "Add Artifact".
              </li>
              <li>
                Once your artifact is created, you can register further versions with Trovi under
                the "Edit" page.
              </li>
            </ol>
          </article>
          <br />
          <div class="mb-4">
            <label class="block text-gray-700 font-bold mb-2">GitHub Repository URL</label>
            <input
              type="text"
              v-model="form.githubRepo"
              id="title"
              name="title"
              class="border rounded w-full py-2 px-3 mb-2"
              placeholder="https://github.com/.../..."
              required
            />
          </div>
          <div v-if="form.loading" class="flex justify-center">
            <PulseLoader />
          </div>
          <div>
            <button
              class="bg-lime-600 hover:bg-black text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Add Artifact
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
