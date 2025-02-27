<script setup>
import chameleonLogo from '@/assets/img/chameleon-logo-small.png'
import repetoLogo from '@/assets/img/reproducible-logo-small.png'
import fountLogo from '@/assets/img/educational-logo-small.png'
import { computed } from 'vue'

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

const href = computed(() => {
  return props.link ? props.badge.redirect_link : undefined
})
</script>

<template>
  <div class="flex flex-col justify-center min-w-5 mx-1">
    <a :href="href" :title="props.badge.name + ' - ' + props.badge.description">
      <img
        :src="badgeIcons[props.badge.name]"
        :alt="props.badge.name + ' - ' + props.badge.description"
      />
    </a>
  </div>
</template>
