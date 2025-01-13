<!-- App.vue -->
<template>
  <div class="min-h-screen flex flex-col bg-lkl-neutral" :class="{ 'flex flex-col': user }">
    <!-- <header v-if="user" class="bg-lkl-blue shadow-sm flex-shrink-0">
      <div class="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center"> -->
        <!-- Logo on the left -->
        <!-- <div class="flex items-center">
          <img 
            src="./assets/logo.png" 
            alt="Logo" 
            class="h-8 w-auto"
          />
        </div> -->
        
        <!-- User info and logout on the right -->
        <!-- <div class="flex items-center gap-4">
          <span class="text-white">{{ user.email }}</span>
          <button 
            @click="handleSignOut" 
            class="px-4 py-2 bg-white text-lkl-blue font-medium rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Abmelden
          </button>
        </div> -->
      <!-- </div>
    </header> -->

    <!-- Main content -->
    <main :class="{ 'flex-1 flex': user }">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Loading overlay -->
    <div 
      v-if="isLoading" 
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div class="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from './services/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref(null)
const isLoading = ref(true)

// Initialize auth state
onMounted(async () => {
  try {
    // Get initial session
    const { data: { session } } = await supabase.auth.getSession()
    user.value = session?.user || null

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      user.value = session?.user || null
      if (event === 'SIGNED_OUT') {
        router.push('/login')
      } else if (event === 'SIGNED_IN') {
        router.push('/chat')
      }
    })
  } catch (error) {
    console.error('Error checking auth status:', error)
  } finally {
    isLoading.value = false
  }
})
</script>