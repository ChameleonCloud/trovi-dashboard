<script setup>
import router from '@/router';
import { reactive } from 'vue';
import { useToast } from 'vue-toastification';
import axios from 'axios';

const form = reactive({
  type: 'Full-Time',
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
  const newArtifact = {
    title: form.title,
    type: form.type,
    location: form.location,
    description: form.description,
    salary: form.salary,
    company: {
      name: form.company.name,
      description: form.company.description,
      contactEmail: form.company.contactEmail,
      contactPhone: form.company.contactPhone,
    },
    githubRepo: form.githubRepo, // Include GitHub repo URL
  };

  try {
    const formData = new FormData();
    formData.append('data', JSON.stringify(newArtifact));

    // Append files to form data
    form.files.forEach(file => {
      formData.append('files[]', file);
    });

    const response = await axios.post('/api/artifacts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    toast.success('Artifact Added Successfully');
    router.push(`/artifacts/${response.data.id}`);
  } catch (error) {
    console.error('Error adding artifact', error);
    toast.error('Artifact Was Not Added');
  }
};
</script>

<template>
  <section class="bg-green-50">
    <div class="container m-auto max-w-2xl py-24">
      <div class="bg-white px-6 py-8 mb-4 shadow-md rounded-md border m-4 md:m-0">
        <form @submit.prevent="handleSubmit">
          <h2 class="text-3xl text-center font-semibold mb-6">New Artifact</h2>

          <div class="mb-4">
            <label for="type" class="block text-gray-700 font-bold mb-2">Artifact Type</label>
            <select v-model="form.type" id="type" name="type" class="border rounded w-full py-2 px-3" required>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Remote">Remote</option>
              <option value="Internship">Internship</option>
            </select>
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-bold mb-2">Artifact Title</label>
            <input type="text" v-model="form.title" id="title" name="title" class="border rounded w-full py-2 px-3 mb-2"
              placeholder="Title of the artifact" required />
          </div>
          <div class="mb-4">
            <label for="description" class="block text-gray-700 font-bold mb-2">Description</label>
            <textarea id="description" v-model="form.description" name="description"
              class="border rounded w-full py-2 px-3" rows="4"
              placeholder="Add a description about the artifact"></textarea>
          </div>

          <div class="mb-4">
            <label for="location" class="block text-gray-700 font-bold mb-2">Paper Link</label>
            <input type="text" v-model="form.location" id="location" name="location"
              class="border rounded w-full py-2 px-3 mb-2" placeholder="Link to the paper" required />
          </div>

          <div class="mb-4">
            <label for="githubRepo" class="block text-gray-700 font-bold mb-2">GitHub Repository (optional)</label>
            <input type="text" v-model="form.githubRepo" id="githubRepo" name="githubRepo"
              class="border rounded w-full py-2 px-3 mb-2" placeholder="URL of the GitHub repository" />
          </div>

          <div class="mb-4">
            <label class="block text-gray-700 font-bold mb-2">Upload Files</label>
            <input type="file" @change="e => form.files = Array.from(e.target.files)" multiple
              class="border rounded w-full py-2 px-3 mb-2" />
          </div>

          <div class="mb-4">
            <h3 class="text-2xl mb-5">Artifact Owner Info</h3>
            <div class="mb-4">
              <label for="company" class="block text-gray-700 font-bold mb-2">Name</label>
              <input type="text" v-model="form.company.name" id="company" name="company"
                class="border rounded w-full py-2 px-3" placeholder="Full Name" />
            </div>

            <div class="mb-4">
              <label for="contact_email" class="block text-gray-700 font-bold mb-2">Contact Email</label>
              <input type="email" v-model="form.company.contactEmail" id="contact_email" name="contact_email"
                class="border rounded w-full py-2 px-3" placeholder="Email address" required />
            </div>

            <div class="mb-4">
              <label for="contact_phone" class="block text-gray-700 font-bold mb-2">Contact Phone</label>
              <input type="text" v-model="form.company.contactPhone" id="contact_phone" name="contact_phone"
                class="border rounded w-full py-2 px-3" placeholder="Contact phone number" />
            </div>
          </div>

          <div>
            <button
              class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline"
              type="submit">
              Add Artifact
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
