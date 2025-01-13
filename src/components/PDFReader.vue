<!-- PDFReader.vue -->
<template>
  <div class="flex flex-col items-center gap-2">
    <div class="w-full">
      <input 
        type="file" 
        ref="fileInput"
        accept=".pdf"
        @change="handleFileSelect"
        :disabled="isLoading"
        class="hidden"
        id="pdf-upload"
      />
      <label 
        for="pdf-upload" 
        class="inline-flex gap-x-1.5 items-center justify-center px-3 py-1.5 bg-lkl-blue text-white text-[15px] rounded-lg hover:bg-opacity-90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        :class="{ 'opacity-50 cursor-not-allowed': isLoading }"
      >
        <IconAttach />
        {{ isLoading ? 'Processing...' : 'Attach' }}
      </label>
    </div>

    <!-- <div 
      v-if="showStatus" 
      class="px-3 py-2 rounded-lg text-sm text-center transition-opacity duration-500"
      :class="{
        'bg-blue-50 text-lkl-blue': statusType === 'info',
        'bg-green-50 text-green-700': statusType === 'success',
        'bg-red-50 text-red-700': statusType === 'error',
        'opacity-0': !showStatus,
        'opacity-100': showStatus
      }"
      style="min-height: 40px;"
    >
      {{ status }}
    </div> -->
  </div>
</template>

<script setup>
import { ref } from 'vue';
import * as pdfjsLib from 'pdfjs-dist';
import IconAttach from '../assets/icons/icon-attach.vue';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

const status = ref('');
const statusType = ref('info');
const isLoading = ref(false);
const showStatus = ref(false);

const emit = defineEmits(['textExtracted']);

async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  
  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
    useWorkerFetch: true,
    isEvalSupported: true
  }).promise;
  
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    status.value = `Processing page ${i} of ${pdf.numPages}...`;
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n\n';
  }
  
  return fullText.trim();
}

async function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  isLoading.value = true;
  status.value = 'Laden...';
  statusType.value = 'info';

  try {
    const text = await extractTextFromPDF(file);
    status.value = 'Erfolgreich geladen';
    statusType.value = 'success';
    emit('textExtracted', { text, filename: file.name }); // This line emits both text and filename
    showStatus.value = true;
    setTimeout(() => {
      showStatus.value = false;
    }, 3000);
  } catch (error) {
    console.error('Error processing PDF:', error);
    status.value = 'Fehler, bitte versuchen Sie es erneut.';
    statusType.value = 'error';
    showStatus.value = true;
    setTimeout(() => {
      showStatus.value = false;
    }, 3000);
  } finally {
    isLoading.value = false;
    event.target.value = '';
  }
}
</script>
  
  <style scoped>
  .pdf-upload {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
    padding: 0.5rem;
  }
  
  .upload-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    background-color: #1976d2;
    color: white;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: background-color 0.2s;
  }
  
  .upload-button:hover:not(.opacity-50) {
    background-color: #1565c0;
  }
  
  .hidden {
    display: none;
  }
  
  .status {
    padding: 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    text-align: center;
    transition: opacity 0.5s ease;
    opacity: 1;
    animation: fade-in 0.5s forwards;
  }
  
  .status.info {
    background-color: #e3f2fd;
    color: #1976d2;
  }
  
  .status.success {
    background-color: #e8f5e9;
    color: #2e7d32;
  }
  
  .status.error {
    background-color: #ffebee;
    color: #c62828;
  }
  
  .status[style*="display: none"] {
    opacity: 0;
  }
  
  .fade-out {
    animation: fade-out 0.5s forwards;
  }
  
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes fade-out {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
  </style>