<script setup>
const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div class="relative-position full-size">
    <!-- Wrapped content -->
    <div :class="{ 'q-opacity-50 q-pointer-events-none': props.loading }">
      <slot />
    </div>

    <!-- Loading overlay -->
    <q-overlay v-if="props.loading" class="flex flex-center" :persistent="true">
      <q-spinner color="primary" size="50px" />
    </q-overlay>
  </div>
</template>

<style scoped>
.relative-position {
  position: relative;
}
.full-size {
  width: 100%;
  height: 100%;
  min-height: 100px; /* optional fallback height if parent has no height */
}
</style>
