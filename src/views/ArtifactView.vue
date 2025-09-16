<script setup>
import PulseLoader from 'vue-spinner/src/PulseLoader.vue'
import BackButton from '@/components/BackButton.vue'
import MainSection from '@/components/MainSection.vue'
import Card from '@/components/Card.vue'

import ArtifactHeader from '@/components/artifact/ArtifactHeader.vue'
import ArtifactAbout from '@/components/artifact/ArtifactAbout.vue'
import ArtifactAuthors from '@/components/artifact/ArtifactAuthors.vue'
import ArtifactVersions from '@/components/artifact/ArtifactVersions.vue'

import { reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useArtifactsStore } from '@/stores/artifact'
import { useToast } from 'vue-toastification'
import Launch from '@/components/artifact/Launch.vue'

const toast = useToast()
const route = useRoute()

const artifactId = route.params.uuid
const artifactsStore = useArtifactsStore()

const state = reactive({
  artifact: {},
  isLoading: true,
  selectedVersion: null,
})

onMounted(async () => {
  try {
    state.artifact = await artifactsStore.fetchArtifactById(artifactId)
    let v = state.artifact?.versions.find((v) => {
      return v.slug.trim() === route.params.version.trim()
    })
    if (v) {
      state.selectedVersion = v
    } else {
      state.selectedVersion = state.artifact.versions[0]
    }
  } catch (error) {
    console.error('Error fetching artifact', error)
    toast.error("Couldn't fetch artifact. It may not exist, or you do not have permission.")
  } finally {
    state.isLoading = false
  }
})
</script>

<template>
  <BackButton />
  <MainSection>
    <Card>
      <div v-if="!state.isLoading" class="grid grid-cols-1 md:grid-cols-70/30 w-full gap-6">
        <main>
          <ArtifactHeader :artifact="state.artifact" />
          <ArtifactAbout :artifact="state.artifact" />
        </main>

        <aside>
          <Launch :artifact="state.artifact" :version_slug="state.selectedVersion?.slug"></Launch>
          <ArtifactAuthors :authors="state.artifact.authors" />
          <ArtifactVersions
            :artifact="state.artifact"
            :version_slug="state.selectedVersion?.slug"
          />
        </aside>
      </div>
      <div v-else class="text-center text-gray-500 dark:text-gray-400 py-6">
        <PulseLoader />
      </div>
    </Card>
  </MainSection>
</template>
