<script setup>
import { computed } from 'vue'
import { videoEmbedUrl } from '@/util'

const props = defineProps({ artifact: Object })

const videos = computed(() =>
  (props.artifact.videos ?? []).map((video) => ({
    url: video.url,
    embedUrl: videoEmbedUrl(video.url),
  })),
)

const heading = computed(() => (videos.value.length === 1 ? 'Video' : 'Videos'))
</script>

<template>
  <div v-if="videos.length" class="q-mb-lg">
    <h2 class="text-h6 text-primary q-mb-md">{{ heading }}</h2>

    <div class="row q-col-gutter-md">
      <div v-for="(video, index) in videos" :key="index" class="col-12 col-md-6 q-mb-md">
        <q-card flat bordered>
          <q-video v-if="video.embedUrl" :src="video.embedUrl" :ratio="16 / 9" />
          <q-card-section v-else class="row items-center q-gutter-sm">
            <q-icon name="videocam" size="sm" color="primary" />
            <a :href="video.url" target="_blank" rel="noopener noreferrer" class="col ellipsis">
              {{ video.url }}
            </a>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>
