<!-- ChatSessionsList.vue -->
<template>
  <div class="flex flex-col bg-lkl-blue">
    <div class="p-5 pb-2.5 flex flex-col space-y-12">
      <div>
        <img src="../assets/logo.png" alt="Logo" />
      </div>
      <button @click="createNewSession"
        class="p-3 flex items-center gap-x-2 bg-lkl-light w-fit text-lkl-blue hover:text-lkl-neutral-light font-semibold text-[15px] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="loading" style="box-shadow: 2px 2px 4.6px 0px rgba(0, 0, 0, 0.25);">
        <IconPulse />
        New Chat
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="p-5 text-white/70">
      Loading sessions...
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="p-5 text-red-300">
      {{ error }}
    </div>

    <!-- Sessions list -->
    <div v-else class="py-5 flex flex-col space-y-6 h-full overflow-hidden">
      <div class="px-5 text-lkl-light-grey text-[17px]">All Conversations</div>
      <ul class="px-5 flex h-full flex-col gap-y-4 overflow-y-auto">
        <div class="flex flex-col gap-y-2" v-for="(sessions, date) in groupedChatSessions" :key="date">
          <div class="font-bold text-lkl-light-grey">{{ date.toUpperCase() }}</div>
          <div class="flex flex-col gap-y-0.5">
            <li v-for="session in sessions" :key="session.id"
              :class="{ 'hover:bg-lkl-grey text-lkl-neutral hover:text-lkl-neutral-light rounded-md py-2 px-3 cursor-pointer transition-colors': true, '!text-lkl-blue !bg-lkl-grey-active': currentSessionId == session.id }"
              @click="selectSession(session)">
              <div class="font-medium truncate">{{ formatTitle(session.title) }}</div>
              <div v-if="isAdmin" class="text-sm text-white/70 mt-1.5">
                <span class="ml-2 text-gray-400">User ID: {{ session.user_id }}</span>
              </div>
            </li>
          </div>
        </div>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { supabase, checkIfAdmin } from '../services/supabase'
import IconPulse from '../assets/icons/icon-pulse.vue'

const groupedChatSessions = ref({})
const currentSessionId = ref(null)
const loading = ref(true)
const error = ref(null)
const subscription = ref(null)
const isAdmin = ref(false)

// Emit selected session to parent
const emit = defineEmits(['select-session'])

const fetchChatSessions = async () => {
  try {
    loading.value = true
    error.value = null

    // Get current user's sessions or all sessions if user is admin
    const { data, error: supabaseError } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false })

    if (supabaseError) throw supabaseError

    // Get today's date
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })

    // Group sessions by created_at date
    groupedChatSessions.value = data.reduce((groups, session) => {
      const sessionDate = new Date(session.updated_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })

      // Use "Today" if the session date is today
      const dateKey = sessionDate === today ? 'Today' : sessionDate

      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(session)
      return groups
    }, {})
  } catch (e) {
    error.value = 'Failed to load chat sessions: ' + e.message
  } finally {
    loading.value = false
  }
}

const createNewSession = async () => {
  try {
    loading.value = true

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No user logged in')

    // Create new session
    const { data, error: createError } = await supabase
      .from('chat_sessions')
      .insert([
        {
          user_id: user.id,
          title: 'New Chat',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (createError) throw createError

    // Determine the date key for the new session
    const sessionDate = new Date(data.updated_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })

    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })

    const dateKey = sessionDate === today ? 'Today' : sessionDate

    // Add new session to the correct date group
    if (!groupedChatSessions.value[dateKey]) {
      groupedChatSessions.value[dateKey] = []
    }
    groupedChatSessions.value[dateKey].unshift(data)
    selectSession(data)
  } catch (e) {
    error.value = 'Failed to create new session: ' + e.message
  } finally {
    loading.value = false
  }
}

const selectSession = (session) => {
  currentSessionId.value = session.id
  emit('select-session', session)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatTitle = (title) => {
  return title.charAt(0).toUpperCase() + title.slice(1);
};


const subscribeToChanges = () => {
  subscription.value = supabase
    .channel('chat_sessions_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_sessions'
      },
      (payload) => {
        if (payload.eventType === 'UPDATE') {
          const updatedSession = payload.new
          groupedChatSessions.value = groupedChatSessions.value.map(session =>
            session.id === updatedSession.id ? updatedSession : session
          )
        }
      }
    )
    .subscribe()
}

const checkUserAdminStatus = async () => {
  isAdmin.value = await checkIfAdmin()
}

onUnmounted(() => {
  if (subscription.value) {
    subscription.value.unsubscribe()
  }
})

onMounted(() => {
  fetchChatSessions()
  subscribeToChanges()
  checkUserAdminStatus()
})


</script>

<style scoped>
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.new-chat-button {
  padding: 0.5rem 1rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.new-chat-button:hover {
  background-color: #45a049;
}

.new-chat-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.chat-sessions-list {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.loading,
.error {
  text-align: center;
  padding: 1rem;
  color: #ccc;
}

.error {
  color: #ff4444;
}

.sessions {
  list-style: none;
  padding: 0;
  margin: 0;
}

.session-item {
  padding: 1rem;
  border-bottom: 1px solid #333;
  cursor: pointer;
  transition: background-color 0.2s;
  background-color: #1a1a1a;
}

.session-item:hover {
  background-color: #2c2c2c;
}

.session-title {
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #fff;
}

.session-meta {
  font-size: 0.875rem;
  color: #999;
}

.session-date {
  font-style: italic;
}
</style>