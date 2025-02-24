<template>
  <div class="search-bar">
    <input
      v-model="searchQuery"
      type="text"
      placeholder="Search for artifacts..."
      @input="onInput"
      class="search-input"
    />
    <button @click="performSearch" class="search-button">Search</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      searchQuery: '',
    }
  },
  methods: {
    onInput() {
      // Handle input changes if needed
    },
    performSearch() {
      // Handle the search functionality here
      this.$emit('search', this.searchQuery)
    },
  },
}
</script>
