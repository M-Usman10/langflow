<!-- AuthCallback.vue-->
  <template>
    <div class="auth-callback">
      <p>Processing authentication...</p>
    </div>
  </template>
  
  <script setup>
  import { onMounted } from 'vue'
  import { supabase } from '../services/supabase'
  import { useRouter } from 'vue-router'
  
  const router = useRouter()
  
  onMounted(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) throw error
      
      if (session) {
        await router.push('/chat')
      } else {
        await router.push('/login')
      }
    } catch (error) {
      console.error('Error in auth callback:', error)
      await router.push('/login')
    }
  })
  </script>
  
  <style scoped>
  .auth-callback {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }
  </style>