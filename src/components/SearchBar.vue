<template>
    <div class="search-bar">
        <input v-model="searchQuery" type="text" placeholder="Search for artifacts..." @input="onInput"
            class="search-input" />
        <button @click="performSearch" class="search-button">
            Search
        </button>
    </div>
</template>

<script>
export default {
    data() {
        return {
            searchQuery: ''
        };
    },
    methods: {
        onInput() {
            // Handle input changes if needed
        },
        performSearch() {
            // Handle the search functionality here
            this.$emit('search', this.searchQuery);
        }
    }
};
</script>

<style scoped>
.search-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 20px 0;
}

.search-input {
    padding: 10px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin-right: 10px;
    flex: 1;
}

.search-button {
    padding: 10px 20px;
    font-size: 16px;
    border: none;
    border-radius: 4px;
    background-color: black;
    color: white;
    cursor: pointer;
}

.search-button:hover {
    background-color: #333;
}
</style>
