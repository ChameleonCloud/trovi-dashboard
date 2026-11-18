<script setup>
// A numbered section of a form, saying what the section is for
defineProps({ step: Number, title: String, caption: String })
</script>

<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section class="row items-center no-wrap">
      <q-avatar size="32px" color="primary" text-color="white" class="text-subtitle1 q-mr-md">
        {{ step }}
      </q-avatar>
      <div>
        <h3 class="text-h6 q-my-none">{{ title }}</h3>
        <div v-if="caption" class="text-caption text-grey-7">{{ caption }}</div>
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section>
      <slot />
    </q-card-section>
  </q-card>
</template>
