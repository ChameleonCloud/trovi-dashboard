<script setup>
import { computed } from 'vue'
import chameleonLogo from '@/assets/img/chameleon-logo-small.png'
import repetoLogo from '@/assets/img/reproducible-logo-small.png'
import fountLogo from '@/assets/img/educational-logo-small.png'

const badgeIcons = {
  chameleon: chameleonLogo,
  reproducible: repetoLogo,
  educational: fountLogo,
}

const props = defineProps({
  badge: Object,
  link: {
    type: Boolean,
    default: true,
  },
})

const href = computed(() => (props.link ? props.badge.redirect_link : null))
</script>

<template>
  <div class="row items-center q-mx-xs q-my-none">
    <a
      v-if="href"
      :href="href"
      :title="props.badge.description"
      class="row items-center no-decoration"
    >
      <img :src="badgeIcons[props.badge.name]" style="width: 2em" />
    </a>

    <div v-else class="row items-center" style="gap: 0.5rem">
      <img :src="badgeIcons[props.badge.name]" style="width: 2em" />
      <span>{{ props.badge.name }}</span>
    </div>
  </div>
</template>
