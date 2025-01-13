<!-- OTPAuth.vue -->
<template>
  <div class="min-h-screen bg-lkl-blue flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
      <h2 class="text-2xl font-bold text-lkl-blue text-center mb-2">
        CLEO KI Assistenz
      </h2>
      
      <p class="text-center text-lkl-blue/80 mb-8">
        Bitte melden Sie sich an
      </p>
      
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <input
            type="email"
            v-model="email"
            placeholder="Ihre E-Mail"
            class="w-full p-3 rounded-lg border border-lkl-light bg-white text-lkl-blue placeholder-lkl-blue/50 focus:outline-none focus:border-lkl-blue focus:ring-2 focus:ring-lkl-blue/20"
            required
          />
        </div>
        
        <button 
          type="submit" 
          class="w-full p-3 bg-lkl-blue text-white font-medium rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loading"
        >
          {{ loading ? 'Wird geladen...' : 'Magic Link senden' }}
        </button>
      </form>
      
      <p 
        v-if="message" 
        class="mt-4 text-center p-3 rounded-lg"
        :class="{
          'bg-red-50 text-red-600': error,
          'bg-green-50 text-green-600': !error
        }"
      >
        {{ message }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../services/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const email = ref('')
const message = ref('')
const error = ref(false)

// Get the base URL from environment variables
const baseUrl = import.meta.env.VITE_APP_URL

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    router.push('/chat')
  }
})

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    router.push('/chat')
  }
})

const handleLogin = async () => {
  try {
    loading.value = true
    error.value = false
    
    const { error: signInError, data } = await supabase.auth.signInWithOtp({
      email: email.value,
      options: {
        emailRedirectTo: `${baseUrl}/auth/callback`  // Using the environment variable
      }
    })

    if (signInError) throw signInError

    message.value = 'Überprüfen Sie Ihre E-Mail auf den Anmelde-Link!'
    error.value = false
  } catch (err) {
    error.value = true
    message.value = err.message
  } finally {
    loading.value = false
  }
}
</script>