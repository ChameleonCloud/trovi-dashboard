<script setup>
import { RouterLink } from 'vue-router';
import { defineProps, ref, computed } from 'vue';

const props = defineProps({
    job: Object,
});

const showFullDescription = ref(false);

const toggleFullDescription = () => {
    showFullDescription.value = !showFullDescription.value;
};

const truncatedDescription = computed(() => {
    let long_description = props.job.long_description;
    if (!showFullDescription.value) {
        long_description = long_description.substring(0, 90) + '...';
    }
    return long_description;
});
</script>

<template>
    <div class="bg-white rounded-xl shadow-md relative">
        <div class="p-4">
            <div class="mb-6">
                <!-- <div class="text-gray-600 my-2">{{ job.type }}</div> -->
                <h3 class="text-xl font-bold">{{ job.title }}</h3>
            </div>

            <div class="mb-5">
                <div>
                    {{ truncatedDescription }}
                </div>
                <button @click="toggleFullDescription" class="text-lime-600 hover:text-lime-800 mb-5">
                    {{ showFullDescription ? 'Less' : 'More' }}
                </button>
            </div>

            <div class="border border-gray-100 mb-5"></div>

            <div class="flex flex-col lg:flex-row justify-between mb-4">
                <div class="flex flex-wrap gap-2 mb-3">
                    <div v-for="(tag, index) in job.tags" :key="index" class="flex items-center text-lime-600">
                        <i class="pi pi-tag text-lime-600 mr-1"></i>
                        {{ tag }}
                    </div>
                </div>
                <RouterLink :to="'/jobs/' + job.uuid"
                    class="h-[36px] bg-lime-600 hover:bg-black text-white px-4 py-2 rounded-lg text-center text-sm">
                    Read More
                </RouterLink>
            </div>
        </div>
    </div>
</template>
