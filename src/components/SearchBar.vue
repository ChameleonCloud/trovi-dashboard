<script setup>
defineProps({
  modelValue: String,
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div>
    <q-input
      filled
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      placeholder="Search artifacts..."
      clearable
      class="full-width"
    />
  </div>
</template>
