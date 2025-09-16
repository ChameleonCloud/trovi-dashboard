<script setup>
import PulseLoader from 'vue-spinner/src/PulseLoader.vue'
import router from '@/router'
import { reactive } from 'vue'
import { useArtifactsStore } from '@/stores/artifact'
import { useAuthStore } from '@/stores/auth'
import MainSection from '@/components/MainSection.vue'
import Card from '@/components/Card.vue'

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
    <Card>
      <form @submit.prevent="handleSubmit">
        <h2 class="text-3xl text-center font-semibold mb-6 text-stone-900 dark:text-stone-100">
          Import Artifact
        </h2>

        <article
          class="prose dark:prose-invert prose-headings:font-bold prose-a:text-lime-600 dark:prose-a:text-lime-400"
        >
          <p>
            To import an artifact, you must provide a GitHub repository URL. This repository should
            be configured with a <code>trovi.json</code>, which contains the artifact's metadata.
          </p>
          <p>Detailed instructions:</p>
          <ol class="list-decimal list-inside">
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
              Once your artifact is created, you can register further versions with Trovi under the
              <em>Edit</em> page.
            </li>
          </ol>
        </article>

        <div class="mt-6 mb-4">
          <label
            for="githubRepo"
            class="block text-stone-800 dark:text-stone-200 font-semibold mb-2"
            >GitHub Repository URL</label
          >
          <input
            id="githubRepo"
            type="url"
            v-model="form.githubRepo"
            name="githubRepo"
            class="border border-gray-300 dark:border-stone-600 rounded w-full py-2 px-3 mb-2 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-lime-500"
            placeholder="https://github.com/owner/repo"
            required
          />
        </div>

        <div v-if="form.loading" class="flex justify-center my-4">
          <PulseLoader />
        </div>

        <button
          class="w-full bg-lime-600 hover:bg-black text-white font-semibold py-2 px-4 rounded-full transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500"
          type="submit"
          :disabled="form.loading"
        >
          Add Artifact
        </button>
      </form>
    </Card>
  </MainSection>
</template>
