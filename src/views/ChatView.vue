<!-- ChatView.vue -->
<template>
  <div class="flex h-screen w-full">
    <!-- Add explicit flex properties to prevent flexbox from redistributing space -->
    <ChatSessionsList @select-session="handleSessionSelect" class="w-[360px] flex-none border-r border-lkl-neutral" />
    <!-- Add flex-none to prevent flex from redistributing space -->
    <div class="w-[calc(100%-360px)] flex-none flex min-w-0">
      <LangflowChat v-if="currentSessionId" :sessionId="currentSessionId" class="flex-1 min-w-0 min-h-0" />
      <div v-else class="flex-1 flex mt-60 text-6xl font-bold justify-center text-lkl-blue">
        How can we help today?
      </div>
    </div>
    <div class="absolute top-8 right-12">
      <div class="relative">
        <span @click="handleShowMenu" class="cursor-pointer text-lkl-blue hover:text-lkl-neutral-light" style="filter: drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.1));"><IconMenu /></span>
        <div ref="menu" v-if="showMenu" class="absolute rounded-[14px] bg-[#D7E1EB] top-7 right-0 p-3 flex flex-col gap-y-1.5" style="filter: drop-shadow(2px 2px 4.6px rgba(0, 0, 0, 0.25));">
          <div class="p-2 pb-1 pt-1 cursor-pointer rounded-lg hover:bg-lkl-grey flex items-center gap-x-1.5 text-[15px]">
            <span><IconUser /></span>
            <span class="text-lkl-black font-semibold">{{ user?.email || '' }}</span>
          </div>
          <div class="w-full border-b border-[#AEAEAE]"></div>
          <div class="pl-2 pt-1 pb-1 cursor-pointer rounded-lg hover:bg-lkl-grey flex items-center gap-x-1.5 text-[15px]">
            <span><IconDashboard /></span>
            <span class="text-lkl-black">Dashboard</span>
          </div>
          <div class="pl-2 pt-1 pb-1 cursor-pointer rounded-lg hover:bg-lkl-grey flex items-center gap-x-1.5 text-[15px]">
            <span><IconSettings /></span>
            <span class="text-lkl-black">Settings</span>
          </div>
          <div class="w-full border-b border-[#AEAEAE]"></div>
          <div @click="handleSignOut" class="pl-2 pt-1 pb-1 cursor-pointer rounded-lg hover:bg-lkl-grey flex items-center gap-x-1.5 text-[15px]">
            <span><IconUser /></span>
            <span class="text-lkl-black">Log Out</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount } from 'vue'
import ChatSessionsList from '../components/ChatSessionsList.vue'
import LangflowChat from '../components/LangflowChat.vue'
import IconMenu from '../assets/icons/icon-menu.vue'
import { supabase } from '../services/supabase'
import IconUser from '../assets/icons/icon-user.vue'
import IconDashboard from '../assets/icons/icon-dashboard.vue'
import IconSettings from '../assets/icons/icon-settings.vue'

const user = ref(null)
const showMenu = ref(false)
const menu = ref(null)
const isLoading = ref(false)

const handleOutsideClick = (event) => {
  if (menu.value && !menu.value.contains(event.target)) {
    showMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
})

// Initialize auth state
onMounted(async () => {
  try {
    // Get initial session
    const { data: { session } } = await supabase.auth.getSession()
    user.value = session?.user || null
  } catch (error) {
    console.error('Error checking auth status:', error)
  } finally {
    isLoading.value = false
  }
})

const handleShowMenu = (event) => {
  event.stopPropagation()
  showMenu.value = !showMenu.value
}

const currentSessionId = ref(null)

const handleSessionSelect = (session) => {
  currentSessionId.value = session.id
}

// Sign out handler
const handleSignOut = async () => {
  try {
    isLoading.value = true
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    console.error('Error signing out:', error)
  } finally {
    isLoading.value = false
  }
}
</script>