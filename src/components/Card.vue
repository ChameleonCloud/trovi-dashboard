<script setup>
import { defineProps } from 'vue';

defineProps({
    bg: {
        type: String,
        default: 'bg-gray-100'
    }
});

</script>

<template>
    <!-- bind to make it dynamic -->
    <div :class="`${bg} p-6 rounded-lg shadow-md`">
        <slot>

        </slot>

    </div>

</template>
