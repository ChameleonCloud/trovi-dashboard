<script setup>
import { ref } from 'vue';

const icons = ref(['mdi-email-outline', 'mdi-linkedin', 'mdi-twitter']);
</script>

<template>
    <footer class="bg-gray-100 text-gray-700 py-4 mt-auto">
        <div class="container mx-auto flex flex-col items-center space-y-4">
            <!-- Social Media Icons -->
            <div class="flex space-x-4">
                <v-btn v-for="icon in icons" :key="icon" :icon="icon" class="mx-2" variant="text"></v-btn>
            </div>
            <!-- Logo and Text -->
            <div class="flex flex-col items-center text-center max-w-4xl px-4 space-y-4">
                <!-- Larger Logo -->
                <img src="@/assets/img/USNSF_Logo_Lockup_with_Headline_RGB_1200ppi.png" alt="US NSF Logo"
                    class="w-48 h-auto" />
                <span>
                    Trovi is funded by a grant from the National Science Foundation
                    (Award No. XXXXXX - CCRI CISE).
                </span>
            </div>
            <v-divider></v-divider>
            <!-- Footer Text -->
            <div class="flex flex-col items-center">
                <div>
                    {{ new Date().getFullYear() }} — <strong>Trovi©</strong>
                </div>
            </div>
        </div>
    </footer>
</template>

<style scoped>
.footer {
    position: relative;
    width: 100%;
}

body {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

main {
    flex: 1;
}
</style>