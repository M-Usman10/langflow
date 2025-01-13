<template>
  <div class="h-full p-8 flex flex-col relative">
    <!-- Scrollable messages container -->
    <div class="flex-1 justify-center overflow-y-auto min-h-0 pb-20" ref="chatContainer">
      <div class="p-4 max-w-[60%] mx-auto">
        <div class="space-y-6">
          <div v-for="(message, index) in messages" :key="index" class="flex w-full"
            :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
            <div class="flex cursor-pointer items-start gap-2 max-w-[70%] group"
              :class="{ 'flex-row-reverse': message.role === 'user' }">
              <!-- Avatar for assistant -->
              <div class="flex items-center gap-x-1.5">
                <CustomCheckbox
                  :key="renderKey"
                  :class="{ 'opacity-0 group-hover:opacity-100': true, '!opacity-100': selectedMessages.filter(msg => msg.index == index).length > 0 }"
                  :checked="selectedMessages.filter(msg => msg.index == index).length > 0"
                  v-if="message.role === 'assistant'"
                  @change="(newvalue) => handleCheckboxChange(newvalue, message, index)"
                  />
                <div v-if="message.role === 'assistant'"
                  class="w-8 h-8 rounded-full flex items-center justify-center bg-white text-lkl-blue flex-shrink-0">
                  <IconCompanyRect />
                </div>
              </div>

              <!-- Message content -->
              <div class="p-3 rounded-lg break-words" :class="[
                message.role === 'user'
                  ? 'bg-lkl-light text-lkl-black ml-auto rounded-[20px] w-full'
                  : 'bg-white text-lkl-black',
                { 'opacity-70': message.isLoading }
              ]">
                <span v-html="message.content"></span><br />
                <div class="flex mt-3 gap-x-3">
                  <button v-if="message.content.includes('Unfortunately, we are')" class="w-fit flex text-lkl-neutral text-[15px] font-medium py-2 px-4 bg-lkl-blue rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Ask an expert
                  </button>
                  <button v-if="message.content.includes('Unfortunately, we are')" class="w-fit flex text-lkl-neutral text-[15px] font-medium py-2 px-4 bg-lkl-blue rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="handleExternalKnowledge">
                    Include External Knowledge
                  </button>
                </div>
                <div v-if="message.isLoading" class="flex items-center gap-1 px-1 py-2">
                  <span class="w-2 h-2 bg-current rounded-full animate-bounce"></span>
                  <span class="w-2 h-2 bg-current rounded-full animate-bounce delay-150"></span>
                  <span class="w-2 h-2 bg-current rounded-full animate-bounce delay-300"></span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="messages.length == 0">
            <div class="flex-1 flex mt-60 text-6xl font-bold justify-center text-lkl-blue">
              How can we help today?
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Fixed input form at viewport bottom with defined height -->
    <div class="flex max-w-[60%] w-3/4 mx-auto flex-col gap-y-3">
      <button @click="openExpertReviewModal"
        class="py-2 px-4 mt-2 rounded-md text-[15px] w-fit font-medium bg-lkl-blue text-lkl-neutral hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="selectedMessages.length == 0">
        Request Expert Review
      </button>
      <div class="bg-[#D7E1EB] w-full rounded-2xl shadow-md">
        <div class="p-4 mx-auto w-full h-full flex items-center">
          <div class="flex gap-y-3 flex-col w-full">
            <span v-if="pdfContentUploaded" @click="removePDF"
              class="py-1 px-2 text-[13px] cursor-pointer font-medium w-fit flex gap-x-1 items-center rounded-md border border-lkl-blue text-lkl-blue hover:text-lkl-neutral-light">
              <IconArticle />
              <span class="text-lkl-blue/70">{{ uploadedFileName }}</span>
              <IconClose />
            </span>
            <textarea 
              v-model="inputMessage"
              @input="autoResize"
              @keyup.enter="handleSendMessage"
              placeholder="Type your message here..."
              class="resize-none bg-[#D7E1EB] outline-none border-none text-lkl-black placeholder-lkl-blue/50 focus:outline-none focus:border-none rounded-md p-2 w-full"
              :disabled="isLoading || isStreaming"
              rows="1"
            ></textarea>
            <div class="flex justify-between w-full items-center">
              <PDFReader @textExtracted="handlePDFText" />
              <button @click="handleSendMessage"
                class="size-[30px] bg-lkl-blue text-lkl-neutral font-medium rounded-full hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="isLoading || isStreaming || !inputMessage.trim()">
                <span v-if="!isLoading && !isStreaming">
                  <IconRightArrow />
                </span>
                <span v-else class="flex justify-center items-center">
                  <Spinner />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Modal :isOpen="isExpertReviewModalOpen" @close="closeExpertReviewModal">
      <div v-if="!isSentToExpert" class="flex flex-col gap-y-7">
        <div class="text-black font-medium text-[17px] text-center">You are requesting a review of the following 2
          messages:</div>
        <div class="flex flex-col gap-y-4 max-h-56 overflow-y-auto">
          <div v-for="(message) in selectedMessages">
            <div class="flex items-start gap-x-1">
              <CustomCheckbox @change="(newvalue) => handleModalCheckboxChange(newvalue, message, message.index)"
                :checked="true" />
              <span class="truncate-2-lines text-lkl-black text-[15px]">{{ message.message }}</span>
            </div>
          </div>
        </div>
        <textarea
          class="w-full h-36 rounded-lg border border-[#ABBAC8] active:outline-none focus:outline-none p-2.5 placeholder:text-[#ABBAC8] text-[15px]"
          placeholder="Please provide additional information..."></textarea>
        <button @click="handleSentToExpert"
          class="w-fit flex m-auto text-lkl-neutral text-[15px] font-medium py-2 px-4 bg-lkl-blue rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style="box-shadow: 2px 2px 4.6px 0px rgba(0, 0, 0, 0.25);">Send to Expert</button>
      </div>
      <div v-else class="flex flex-col items-center justify-center gap-y-7 py-12">
        <span class="text-black text-[17px] font-medium flex items-center gap-x-0.5"><span>Message sent
            successfully!</span>
          <IconCheck />
        </span>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useLangflow, DEFAULT_TWEAKS } from '../services/langflowClient'
import { saveMessage, getChatHistory, updateSessionTitle } from '../services/supabase'
import PDFReader from './PDFReader.vue'
import IconRightArrow from '../assets/icons/icon-right-arrow.vue'
import Spinner from './Spinner.vue'
import IconArticle from '../assets/icons/icon-article.vue'
import IconClose from '../assets/icons/icon-close.vue'
import IconCompanyRect from '../assets/icons/icon-company-rect.vue'
import IconCheck from '../assets/icons/icon-check.vue'
import CustomCheckbox from './CustomCheckbox.vue'
import Modal from './Modal.vue'

const inputMessage = ref('')
const chatContainer = ref(null)
const { runFlow, isLoading, error, chatHistory } = useLangflow()
const isStreaming = ref(false)
const isSentToExpert = ref(false)
const pdfContentBySession = ref({})
const uploadedFileName = ref('')
const selectedMessages = ref([])
const selectedMessagesInModal = ref([])
const renderKey = ref(0);

const props = defineProps({
  sessionId: {
    type: String,
    required: true
  }
})

const autoResize = (event) => {
  const textarea = event.target;
  textarea.style.height = 'auto'; // Reset height to calculate the new height
  textarea.style.height = `${textarea.scrollHeight}px`; // Set height to match content
};

const isExpertReviewModalOpen = ref(false);

const openExpertReviewModal = () => {
  isExpertReviewModalOpen.value = true;
  selectedMessagesInModal.value = selectedMessages.value
};

const closeExpertReviewModal = () => {
  isExpertReviewModalOpen.value = false;
  isSentToExpert.value = false;
  renderKey.value += 1;
};

// Compute whether PDF content is uploaded for current session
const pdfContentUploaded = computed(() => {
  return pdfContentBySession.value[props.sessionId]?.length > 0
})

const handleCheckboxChange = (newValue, message, index) => {
  if (newValue) {
    selectedMessages.value.push({ index, message: message.content });
  } else {
    selectedMessages.value = selectedMessages.value.filter(msg => msg.index !== index);
  }
}

const handleModalCheckboxChange = (newValue, message, index) => {
  if (newValue) {
    selectedMessagesInModal.value.push({ index, message: message.content });
  } else {
    selectedMessagesInModal.value = selectedMessagesInModal.value.filter(msg => msg.index !== index);
  }
}

const handleSentToExpert = () => {
  isSentToExpert.value = true
  selectedMessages.value = [];
}

// Function to format messages
const formatMessage = (message) => {
  return message
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Replace double asterisks with <strong> tags
    .replace(/\n/g, '<br>'); // Replace new lines with <br> tags
};

// Simplified computed property for messages
const messages = computed(() => {
  console.log('Messages computed, current chatHistory:', chatHistory.value)
  return chatHistory.value
    .filter(message => message.role !== 'system') // Don't show system messages (PDF content)
    .map(message => ({
      role: message.role,
      content: formatMessage(message.content), // Format the message content
      local: message.local || false,
      isLoading: message.isLoading || false
    }))
})

// Load chat history when sessionId changes
watch(() => props.sessionId, async (newSessionId) => {
  console.log('SessionId changed:', newSessionId)
  if (newSessionId) {
    try {
      selectedMessages.value = []
      selectedMessagesInModal.value = []
      console.log('Loading chat history')
      const messages = await getChatHistory(newSessionId)
      console.log('Retrieved messages:', messages)

      // Clear current chat history
      chatHistory.value = messages.map(msg => ({
        role: msg.role,
        content: msg.message,
        isLoading: false
      }));

      // Load PDF content for the current session
      if (!pdfContentBySession.value[newSessionId]) {
        pdfContentBySession.value[newSessionId] = []; // Initialize if not exists
      }

      // Add PDF content to chat history if available
      pdfContentBySession.value[newSessionId].forEach(pdfText => {
        chatHistory.value.push({
          role: 'system', // Indicate this is a system message
          content: `Document context:\n\n${pdfText}`,
          local: true,
          skipSave: true  // Flag to indicate this shouldn't be saved to DB
        });
      });

      console.log('Updated chatHistory:', chatHistory.value)
      scrollToBottom()
    } catch (error) {
      console.error('Error loading chat history:', error)
    }
  }
}, { immediate: true })

// Handle PDF text extraction
const handlePDFText = ({ text, filename }) => {
  try {
    const sessionId = props.sessionId; // Get the current session ID
    if (!pdfContentBySession.value[sessionId]) {
      pdfContentBySession.value[sessionId] = []; // Initialize if not exists
    }

    // Limit the text to the first 10,000 characters
    const truncatedText = text.length > 10000 ? text.substring(0, 10000) : text;
    pdfContentBySession.value[sessionId].push(truncatedText); // Store PDF content

    // Add the PDF content to local chat history
    chatHistory.value.push({
      role: 'system', // Indicate this is a system message
      content: `Document context from ${filename}:\n\n${truncatedText}`,
      local: true,
      skipSave: true  // Flag to indicate this shouldn't be saved to DB
    });

    uploadedFileName.value = filename
    scrollToBottom();
  } catch (err) {
    console.error('Error handling PDF text:', err);
  }
}

const removePDF = () => {
  const sessionId = props.sessionId;
  if (pdfContentBySession.value[sessionId]) {
    pdfContentBySession.value[sessionId] = []; // Clear PDF content
    uploadedFileName.value = ''; // Clear the uploaded file name
    chatHistory.value = chatHistory.value.filter(msg => msg.role !== 'system'); // Remove system messages
  }
};

// Scroll handler
const scrollToBottom = () => {
  console.log('Attempting to scroll to the bottom of the chat container');
  // Use window.scrollTo for smooth scrolling
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: 'smooth'
  });
  console.log('Scrolled to the bottom of the window');
}

// Watch messages and scroll
watch(messages, (newVal) => {
  console.log('Messages changed, new value:', newVal)
  scrollToBottom()
}, { deep: true })

// Extract message text from API response
const extractMessageText = (data) => {
  console.log('Extracting message from raw data:', data);

  const outputs = data?.outputs?.[0]?.outputs || [];
  const firstMessage = outputs[0]?.results?.message?.data?.text || '';
  const secondMessage = outputs[1]?.results?.message?.data?.text || '';

  if (!firstMessage.trim() && secondMessage.trim()) {
    console.log('First message is empty, using the second message text:', secondMessage);
    return secondMessage;
  }

  if (firstMessage.trim()) {
    console.log('First message is not empty, returning identifier');
    return "Unfortunately, we are unable to answer your inquiry with sufficient certainty based on our available data sources and can only address questions related to import and customs law. Please feel free to contact an expert or refer to external knowledge.";
  }

  console.log('No valid message found, returning null');
  return null;
};


// Process response data
const processResponseData = async (data) => {
  console.log('Processing response data:', data);
  const messageText = extractMessageText(data);

  if (messageText) {
    console.log('Valid message text found:', messageText);
    const loadingMessage = chatHistory.value.find(msg => msg.isLoading);

    if (loadingMessage) {
      console.log('Updating loading message with response');
      loadingMessage.content = messageText;
      loadingMessage.isLoading = false;
    } else {
      console.log('Adding new assistant message');
      chatHistory.value.push({
        role: 'assistant',
        content: messageText,
        local: true,
        isLoading: false
      });
    }

    await saveMessage(props.sessionId, 'assistant', messageText);
  } else {
    console.log('No valid message text found in response');
  }
};


// Modified handleSendMessage function for the chat component
const handleSendMessage = async () => {
  console.log('handleSendMessage triggered');

  if (!inputMessage.value.trim() || isLoading.value || isStreaming.value) {
    console.log('Send prevented:', {
      emptyInput: !inputMessage.value.trim(),
      isLoading: isLoading.value,
      isStreaming: isStreaming.value
    });
    return;
  }

  const userMessage = inputMessage.value.trim();
  console.log('Processing user message:', userMessage);
  inputMessage.value = '';
  const isFirstMessage = chatHistory.value.length === 0

  // Add user message to chat history
  chatHistory.value.push({
    role: 'user',
    content: userMessage,
    local: true
  });

  // Save user message to the database
  try {
    console.log('Saving user message to DB')
    await saveMessage(props.sessionId, 'user', userMessage)

    // Update session title if this is the first message
    if (isFirstMessage) {
      const truncatedTitle = userMessage.length > 40
        ? `${userMessage.substring(0, 40)}...`
        : userMessage
      await updateSessionTitle(props.sessionId, truncatedTitle)
    }
  } catch (err) {
    console.error('Error saving user message:', err);
  }

  // Add loading message for assistant
  chatHistory.value.push({
    role: 'assistant',
    content: 'Thinking...',
    local: true,
    isLoading: true
  });

  // Wait for the DOM to update
  await nextTick();

  // Scroll to the bottom after updating chat history
  scrollToBottom();

  try {
    console.log('Running flow with message');
    const response = await runFlow(userMessage);

    console.log('Flow response received:', response);
    if (response?.outputs) {
      await processResponseData(response);
    }

    // Wait for the DOM to update after processing the response
    await nextTick();

    // Scroll to the bottom again after the response is added
    scrollToBottom();

  } catch (err) {
    console.error('Error in handleSendMessage:', err);
  }
}

const handleExternalKnowledge = async () => {
  const message = "Versuchen Sie meine Frage zu beantworten, indem Sie externes Wissen hinzuziehen.";

  // Add user message to chat history
  chatHistory.value.push({
    role: 'user',
    content: message,
    local: true
  });

  // Save user message to the database
  try {
    console.log('Saving external knowledge message to DB')
    await saveMessage(props.sessionId, 'user', message)
  } catch (err) {
    console.error('Error saving external knowledge message:', err);
  }

  // Add loading message for assistant
  chatHistory.value.push({
    role: 'assistant',
    content: 'Thinking...',
    local: true,
    isLoading: true
  });

  // Wait for the DOM to update
  await nextTick();

  // Scroll to the bottom after updating chat history
  scrollToBottom();

  try {
    console.log('Running flow with external knowledge message');
    const response = await runFlow(message);

    console.log('Flow response received:', response);
    if (response?.outputs) {
      await processResponseData(response);
    }

    // Wait for the DOM to update after processing the response
    await nextTick();

    // Scroll to the bottom again after the response is added
    scrollToBottom();

  } catch (err) {
    console.error('Error in handleExternalKnowledge:', err);
  }
}

</script>

<style scoped>
/* Your existing styles remain unchanged */

/* Adjust the padding-bottom of the messages container */
.pb-20 {
  padding-bottom: 5rem;
  /* 80px, adjust if needed */
}

/* Optional: Add a subtle shadow to the fixed input container */
.fixed.bottom-0 {
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
}

/* Optional: Add a subtle shadow to the fixed input container */
.fixed.bottom-0 {
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
}

/* Ensure that the fixed input does not cover messages */
.pb-24 {
  padding-bottom: 6rem;
  /* Adjust if needed */
}

/* Add this new style for PDF upload container */
.pdf-upload-container {
  padding: 0.5rem;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #111827;
}

.chat-header {
  flex: none;
  padding: 0.75rem 1rem;
  background-color: #1f2937;
  border-bottom: 1px solid #374151;
}

.chat-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  height: 400px;
  /* Set a fixed height for testing */
  overflow-y: auto;
  /* Ensure overflow is set to auto */
}

.message-wrapper {
  display: flex;
  width: 100%;
  margin-bottom: 1.5rem;
}

.message-wrapper.user {
  justify-content: flex-end;
}

.message-wrapper.assistant {
  justify-content: flex-start;
}

.message-content-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  max-width: 70%;
  /* Move max-width constraint here */
}

.user .message-content-wrapper {
  flex-direction: row-reverse;
}

.avatar-circle {
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: #4B5563;
  flex-shrink: 0;
}

.avatar-circle span {
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
}

.message-bubble {
  padding: 0.5rem 0.75rem;
  border-radius: 1rem;
  word-wrap: break-word;
  width: 100%;
  /* Take full width of parent */
  min-width: 60px;
}

.user-message {
  background-color: #2563eb;
  color: white;
  border-top-right-radius: 0.25rem;
}

.assistant-message {
  background-color: #374151;
  color: white;
  border-top-left-radius: 0.25rem;
}

.message-bubble p {
  font-size: 0.875rem;
  white-space: pre-wrap;
}

.typing-indicator {
  font-size: 0.75rem;
  color: #9CA3AF;
  font-style: italic;
  margin-top: 0.25rem;
}

/* Scrollbar styling */
.messages-container {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.messages-container::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.input-container {
  flex: none;
  padding: 1.5rem;
  background-color: #1f2937;
  border-top: 1px solid #374151;
  display: flex;
  justify-content: center;
  /* Center the input area */
}

.input-wrapper {
  display: flex;
  gap: 1rem;
  width: 90%;
  /* Take up most of the width */
  max-width: 900px;
  /* But not too wide on large screens */
}

.message-input {
  flex: 1;
  padding: 0.75rem 1rem;
  height: 3rem;
  /* Increased height */
  border-radius: 0.5rem;
  background-color: #374151;
  color: white;
  border: 1px solid #4B5563;
  font-size: 1rem;
}

.message-input::placeholder {
  color: #9CA3AF;
}

.message-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.message-input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.send-button {
  padding: 0 1.5rem;
  height: 3rem;
  /* Match input height */
  background-color: #2563eb;
  color: white;
  font-weight: 500;
  border-radius: 0.5rem;
  border: none;
  transition: background-color 0.2s;
}

.send-button:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-dots {
  display: flex;
  align-items: center;
}

.dot {
  width: 0.5rem;
  height: 0.5rem;
  margin: 0 0.1rem;
  border-radius: 50%;
  background-color: #374151;
  /* Adjust color as needed */
  animation: loading 1s infinite;
}

.dot:nth-child(1) {
  animation-delay: 0s;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes loading {

  0%,
  80%,
  100% {
    opacity: 0.2;
  }

  40% {
    opacity: 1;
  }
}

.fade-in {
  animation: fadeIn 0.5s ease-in-out;
  /* Adjust duration and easing as needed */
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
    /* Optional: adds a slight upward movement */
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem;
}

.typing-indicator span {
  width: 0.5rem;
  height: 0.5rem;
  background-color: #9ca3af;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {

  0%,
  80%,
  100% {
    transform: scale(0);
  }

  40% {
    transform: scale(1);
  }
}

.message-bubble.loading {
  background-color: #2d3748;
}

/* Add this new style for the content uploaded message */
.content-uploaded {
  color: #000000;
  /* Change to a contrasting color */
  font-weight: bold;
  /* Make it bold for better visibility */
}

.message-button {
  display: inline-block;
  margin-top: 0.5rem;
  margin-left: 10px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  /* Small button text */
  font-weight: 500;
  color: white;
  background-color: #2563eb;
  /* Matches send button color */
  border: none;
  border-radius: 0.375rem;
  /* Slightly rounded corners */
  cursor: pointer;
  text-align: center;
  transition: background-color 0.2s, transform 0.2s;
  /* Smooth hover effects */
}

.message-button:hover {
  background-color: #1d4ed8;
  /* Darker shade on hover */
}

.message-button:active {
  transform: scale(0.95);
  /* Slight press effect */
}

.message-button:focus {
  outline: 2px solid #93c5fd;
  /* Subtle focus ring */
  outline-offset: 2px;
}

.truncate-2-lines {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  /* Number of lines to show */
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>