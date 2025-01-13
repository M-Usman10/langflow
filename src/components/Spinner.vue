<template>
    <div class="spinner" v-if="loading"></div>
</template>

<script setup>
import { ref } from 'vue'

// You can use a prop or a ref to control the loading state
const loading = ref(true)
</script>

<style scoped>
.spinner {
    border: 2.5px solid rgba(0, 0, 0, 0.1);
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border-left-color: rgb(255, 255, 255);
    animation: spin 1s ease infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}
</style>