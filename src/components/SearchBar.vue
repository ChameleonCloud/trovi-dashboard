<script setup>
defineProps({
  modelValue: String,
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="mb-6">
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      type="text"
      placeholder="Search artifacts..."
      class="w-full px-4 py-3 border border-gray-500 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-lime-500 transition duration-100 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
    />
  </div>
</template>
