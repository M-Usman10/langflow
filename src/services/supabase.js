import { createClient } from '@supabase/supabase-js'

// Environment variables for Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const getChatHistory = async (sessionId) => {
  try {
    const { data: messages, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return messages
  } catch (error) {
    console.error('Error fetching chat history:', error)
    throw error
  }
}

export const checkIfAdmin = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No user logged in')
    
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()

    console.log(userData)

    if (userError) throw userError

    return userData.is_admin
  } catch (error) {
    console.error('Error checking if user is admin:', error)
    throw error
  }
}


export const getCurrentUserSessions = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No user logged in')
    
      console.log(user)
    // Check if the user is an admin
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (userError) throw userError

    console.log("Is admin: " + userData.is_admin)
    // If the user is an admin, fetch all sessions; otherwise, fetch only their sessions
    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false })
      .if(userData.is_admin, (query) => query) // If admin, fetch all sessions
      .if(!userData.is_admin, (query) => query.eq('user_id', user.id)) // If not admin, fetch user-specific sessions

    if (error) throw error
    return sessions
  } catch (error) {
    console.error('Error fetching user sessions:', error)
    throw error
  }
}

export const saveMessage = async (sessionId, role, content) => {
  try {
    const { data, error } = await supabase
      .from('chat_history')
      .insert([
        {
          session_id: sessionId,
          role,
          message: content,
        }
      ])

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error saving message:', error)
    throw error
  }
}

export const createNewSession = async (title = 'Unbenanneter Chat') => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No user logged in')

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([
        {
          user_id: user.id,
          title
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating new session:', error)
    throw error
  }
}

// Add to supabase.js
export const updateSessionTitle = async (sessionId, title) => {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .update({ title })
      .eq('id', sessionId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating session title:', error)
    throw error
  }
}

export const sendMessage = async (sessionId, inputMessage, isLoading, chatHistory, runFlow, DEFAULT_TWEAKS) => {
  if (!inputMessage.value.trim() || isLoading.value) return

  const userMessage = inputMessage.value.trim()
  inputMessage.value = '' // Clear input right away

  // Immediately add user message to chat history
  chatHistory.value.push({
    role: 'user',
    content: userMessage,
    local: true // Add this flag to identify locally added messages
  })

  try {
    // Save user message to Supabase
    await saveMessage(sessionId, 'user', userMessage)

    // Get response from API
    const response = await runFlow(userMessage, {
      stream: false,
      tweaks: DEFAULT_TWEAKS,
      onUpdate: (data) => {
        console.log('Stream update:', data)
      },
      onClose: () => {
        console.log('Stream closed')
      },
      onError: (error) => {
        console.error('Stream error:', error)
      }
    })

    // Add assistant's response to chat history
    chatHistory.value.push({
      role: 'assistant',
      content: response,
      local: true
    })

    // Save assistant's response to Supabase
    await saveMessage(sessionId, 'assistant', response)
  } catch (err) {
    console.error('Error sending message:', err)
    // Optionally show an error message to the user
  }
}

export { supabase }