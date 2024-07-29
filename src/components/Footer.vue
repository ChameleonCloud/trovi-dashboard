<script>
export default {
    data: () => ({
        icons: ['mdi-facebook', 'mdi-twitter', 'mdi-linkedin', 'mdi-instagram'],
    }),
};
</script>

<template>
    <footer class="bg-gray-100 text-gray-700 py-4">
        <div class="container mx-auto flex flex-col items-center space-y-4">
            <div class="flex space-x-4">
                <v-btn v-for="icon in icons" :key="icon" :icon="icon" class="mx-2" variant="text"></v-btn>
            </div>
            <div class="text-center max-w-4xl px-4">
                Trovi is funded by a grant from the National Science Foundation
                (Award No. XXXXXX - CCRI CISE).
            </div>
            <v-divider></v-divider>
            <div>
                {{ new Date().getFullYear() }} — <strong>Trovi©</strong>
            </div>
        </div>
    </footer>
</template>

<style scoped>
.footer {
    position: absolute;
    bottom: 0;
    width: 100%;
}
</style>
