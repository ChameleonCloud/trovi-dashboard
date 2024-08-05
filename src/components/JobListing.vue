<script setup>
import { RouterLink } from 'vue-router';
import { defineProps, ref, computed } from 'vue';

// Define props
const props = defineProps({
    job: {
        type: Object,
        required: true
    }
});

// State to manage full description toggle
const showFullDescription = ref(false);

// Toggle full description
const toggleFullDescription = () => {
    showFullDescription.value = !showFullDescription.value;
};

// Compute truncated description
const truncatedDescription = computed(() => {
    let long_description = props.job.long_description || '';
    if (!showFullDescription.value && long_description.length > 90) {
        long_description = long_description.substring(0, 90) + '...';
    }
    return long_description;
});
</script>

<template>
    <div class="bg-white rounded-xl shadow-md relative">
        <div class="p-4">
            <!-- Job Title -->
            <div class="mb-6">
                <h3 class="text-xl font-bold">{{ props.job.title }}</h3>
            </div>

            <!-- Job Description -->
            <div class="mb-5">
                <div>
                    {{ truncatedDescription }}
                </div>
                <button @click="toggleFullDescription" class="text-lime-600 hover:text-lime-800 mb-5">
                    {{ showFullDescription ? 'Less' : 'More' }}
                </button>
            </div>

            <!-- Separator -->
            <div class="border border-gray-100 mb-5"></div>

            <!-- Tags and Read More Link -->
            <div class="flex flex-col lg:flex-row justify-between mb-4">
                <!-- Tags -->
                <div class="flex flex-wrap gap-2 mb-3">
                    <div v-if="props.job.tags.length === 0" class="text-gray-500">No tags</div>
                    <div v-for="(tag, index) in props.job.tags" :key="index" class="flex items-center text-lime-600">
                        <i class="pi pi-tag text-lime-600 mr-1"></i>
                        {{ tag }}
                    </div>
                </div>
                <!-- Read More Link -->
                <RouterLink :to="'/jobs/' + props.job.uuid"
                    class="h-[36px] bg-lime-600 hover:bg-black text-white px-4 py-2 rounded-lg text-center text-sm">
                    Read More
                </RouterLink>
            </div>
        </div>
    </div>
</template>
