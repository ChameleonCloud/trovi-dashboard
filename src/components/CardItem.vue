<script setup>
defineProps({
  to: {
    type: String,
    required: true,
  },
  to_label: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <q-card>
    <q-card-section>
      <h2 class="text-h4 q-ma-sm">{{ title }}</h2>
    </q-card-section>
    <q-separator inset />
    <q-card-section>
      <p class="mt-2 mb-4">
        <slot></slot>
      </p>
      <q-btn :to="to" color="primary" class="q-px-md q-py-sm font-medium">
        {{ to_label }}
      </q-btn>
    </q-card-section>
  </q-card>
</template>
