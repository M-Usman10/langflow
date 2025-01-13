<template>
    <div v-if="isOpen" class="fixed inset-0 bg-[#39576c66] flex items-center justify-center" style="backdrop-filter: blur(3px);"
        @click.self="closeModal">
        <div class="bg-white relative p-5 rounded-lg shadow-lg max-w-3xl w-full" style="box-shadow: 4px 4px 10.1px 0px rgba(0, 0, 0, 0.20);">
            <slot></slot>
            <button @click="closeModal" class="absolute top-2 right-2 rounded-full text-lkl-blue hover:text-lkl-neutral-light">
                <IconClose />
            </button>
        </div>
    </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import IconClose from '../assets/icons/icon-close.vue';

const props = defineProps({
    isOpen: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['close']);

const closeModal = () => {
    emit('close');
};
</script>