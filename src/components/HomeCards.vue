<script setup>
import Card from '@/components/Card.vue';
</script>
<template>
    <!-- Learn More, Get Started, and Try It with Uniform Gray Palette -->
    <section class="py-4">
        <div class="container-xl lg:container m-auto">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg">
                <Card>
                    <h2 class="text-2xl font-bold">Learn More</h2>
                    <p class="mt-2 mb-4">
                        Trovi, an open platform for practical reproducibility.
                    </p>
                    <a href="learnmore.html"
                        class="inline-block bg-gray-500 text-white rounded-lg px-4 py-2 hover:bg-gray-600">
                        Learn More
                    </a>
                </Card>
                <Card>
                    <h2 class="text-2xl font-bold">Get Started</h2>
                    <p class="mt-2 mb-4">
                        Get started with our collection of shared artifacts.
                    </p>
                    <a href="getstarted.html"
                        class="inline-block bg-gray-500 text-white rounded-lg px-4 py-2 hover:bg-gray-600">
                        Get Started
                    </a>
                </Card>
                <!-- <Card bg="bg-green-100"> Dynamic component-->
                <Card>
                    <h2 class="text-2xl font-bold">Try It</h2>
                    <p class="mt-2 mb-4">
                        Create a new artifact and share it with the community.
                    </p>
                    <a href="tryit" class="inline-block bg-gray-500 text-white rounded-lg px-4 py-2 hover:bg-gray-600">
                        Try It
                    </a>
                </Card>
            </div>
        </div>
    </section>
</template>
