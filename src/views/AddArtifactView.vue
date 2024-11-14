<script setup>
import router from '@/router';
import { reactive } from 'vue';
import { useToast } from 'vue-toastification';
import axios from 'axios';

const form = reactive({
  type: '',
  title: '',
  description: '',
  salary: '',
  location: '',
  company: {
    name: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
  },
  files: [], // For file upload
  githubRepo: '' // For GitHub repository URL
});

const toast = useToast();

const handleSubmit = async () => {
  console.log("test")
  router.push({ path: '/artifacts/b3cf12af-b832-4f91-a35c-356c9ffe09f6' })

};
</script>

<template>
  <section class="bg-green-50">
    <div class="container m-auto max-w-2xl py-24">
      <div class="bg-white px-6 py-8 mb-4 shadow-md rounded-md border m-4 md:m-0">
        <form @submit.prevent="handleSubmit">
          <h2 class="text-3xl text-center font-semibold mb-6">Import Artifact</h2>

          <div class="mb-4">
            <label class="block text-gray-700 font-bold mb-2">GitHub Repository URL</label>
            <input type="text" v-model="form.title" id="title" name="title" class="border rounded w-full py-2 px-3 mb-2"
              placeholder="https://github.com/.../..." required />
          </div>
          <div>
            <button
              class="bg-lime-600 hover:bg-black text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline"
              type="submit">
              Add Artifact
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
