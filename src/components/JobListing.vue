<script setup>
import { RouterLink } from 'vue-router';
import { defineProps, ref, computed } from 'vue';

const props = defineProps({
    job: Object,
});

const showFullDescription = ref(false);

const toggleFullDescription = () => {
    showFullDescription.value = !showFullDescription.value;
}

const truncatedDescription = computed(() => {
    let short_description = props.job.short_description;
    if (!showFullDescription.value) {
        short_description = short_description.substring(0, 90) + '...';
    }
    return short_description;
});
</script>

<template>
    <!-- Job Listing 1 -->
    <div class="bg-white rounded-xl shadow-md relative p-4">
        <div class="mb-4">
            <div class="text-gray-600 my-2">{{ job.type }}</div>
            <h3 class="text-xl font-bold mb-2">{{ job.title }}</h3>
            <div class="text-gray-600 mb-4">
                <div>
                    {{ truncatedDescription }}
                </div>
                <button @click="toggleFullDescription" class="text-lime-600 hover:text-green-600">
                    {{ showFullDescription ? 'Less' : 'More' }}
                </button>
            </div>
        </div>

        <!-- Tags Section -->
        <div class="mb-4">
            <div class="flex flex-wrap gap-2">
                <template v-for="tag in job.tags" :key="tag">
                    <span
                        class="flex items-center bg-lime-500 text-white text-sm font-medium px-2.5 py-0.5 rounded-full">
                        <i class="fas fa-tag mr-1"></i> {{ tag }}
                    </span>
                </template>
            </div>
        </div>

        <div class="border border-gray-100 mb-4"></div>

        <!-- Author and Institution Section -->
        <div class="mb-4">
            <div v-if="job.authors && job.authors.length > 0" class="flex flex-col">
                <div class="flex items-center mb-1">
                    <h3 class="text-lime-600 mr-2">Author:</h3>
                    <span>{{ job.authors[0].full_name }}</span>
                </div>
                <div class="flex items-center">
                    <h3 class="text-lime-600 mr-2">Institution:</h3>
                    <span>{{ job.authors[0].affiliation }}</span>
                </div>
            </div>
        </div>

        <!-- Button Section -->
        <div class="flex justify-end">
            <RouterLink :to="'/jobs/' + job.uuid"
                class="bg-lime-600 hover:bg-lime-600 text-white px-5 py-2 rounded-lg text-center text-sm">
                View
            </RouterLink>
        </div>
    </div>
</template>