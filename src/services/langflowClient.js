// langflowClient.js
import { ref } from 'vue'

/**
 * Reads env variables defined in .env
 */
const LANGFLOW_BASE_URL = import.meta.env.VITE_LANGFLOW_BASE_URL
const LANGFLOW_FLOW_ID  = import.meta.env.VITE_LANGFLOW_FLOW_ID || 'fallback-flow-id'
const LANGFLOW_API_KEY  = import.meta.env.VITE_LANGFLOW_API_KEY || ''

/**
 * Example "English" node tweaks (from your snippet).
 * Modify these if the node IDs differ in your new flow.
 */
export const DEFAULT_TWEAKS = {
  "TextInput-Blns1": {},
  "Prompt-Nsqv8": {},
  "TextInput-BXSlv": {},
  "OpenAIEmbeddings-LMnen": {},
  "AstraDB-VbzvD": {},
  "ParseData-FVoPT": {},
  "ConditionalRouter-Ew6K8": {},
  "OpenAIModel-MeEBp": {},
  "ChatOutput-hefZs": {},
  "ChatOutput-eguhz": {},
  "ChatInput-QDPr8": {},
  "Prompt-XhNxo": {}
}

export class LangflowClient {
  constructor() {
    this.baseURL = LANGFLOW_BASE_URL
    this.flowId  = LANGFLOW_FLOW_ID
    this.apiKey  = LANGFLOW_API_KEY
  }

  /**
   * General POST request to the flow endpoint.
   */
  async makeRequest(endpoint, body) {
    // Build the full URL
    const url = this.baseURL + endpoint

    console.log('Making request to:', url)
    console.log('Request body:', body)

    const headers = {
      "Content-Type": "application/json",
      "x-api-key": this.apiKey
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        mode: 'cors' // Ensures a CORS request
      })

      if (!response.ok) {
        // Attempt to parse error JSON
        let errorMsg = ''
        try {
          const errorData = await response.json()
          errorMsg = JSON.stringify(errorData)
        } catch (err) {
          // If not valid JSON, fallback to text
          errorMsg = await response.text()
        }

        throw new Error(`${response.status} ${response.statusText} - ${errorMsg}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Request failed:', error)
      throw error
    }
  }

  /**
   * Initiate a run/session on LangFlow server.
   * @param {String} inputValue - user’s current message
   * @param {Array} history     - chat history
   * @param {String} inputType  - usually 'chat'
   * @param {String} outputType - usually 'chat'
   * @param {Boolean} stream    - toggle streaming
   * @param {Object} tweaks     - extra node config
   */
  async initiateSession(
    inputValue,
    history = [],
    inputType = 'chat',
    outputType = 'chat',
    stream = false,
    tweaks = {}
  ) {
    // The flow endpoint: /api/v1/run/<flowId>?stream=<bool>
    const endpoint = `/api/v1/run/${this.flowId}?stream=${stream}`

    // Merge defaults with user-provided tweaks
    const updatedTweaks = {
      ...DEFAULT_TWEAKS,
      ...tweaks,
      // Example: pass the chat history to a node
      "TextInput-Blns1": {
        "input_value": JSON.stringify(history)
      },
      // Example: pass the current user message to another node
      "TextInput-BXSlv": {
        "input_value": inputValue
      }
    }

    const requestBody = {
      input_type: inputType,
      output_type: outputType,
      tweaks: updatedTweaks
    }

    return this.makeRequest(endpoint, requestBody)
  }

  /**
   * If your flow is set up to provide Server-Sent Events (SSE) streaming,
   * you can handle it here.
   */
  async handleStream(streamUrl, onUpdate, onClose, onError) {
    const url = this.baseURL + streamUrl
    console.log('Streaming from:', url)

    try {
      const response = await fetch(url, {
        headers: {
          'x-api-key': this.apiKey,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        },
        mode: 'cors'
      })

      if (!response.ok) {
        let errorText = ''
        try {
          // Attempt JSON
          const errJson = await response.json()
          errorText = JSON.stringify(errJson)
        } catch (err) {
          // Fallback to text
          errorText = await response.text()
        }

        console.error('Stream response error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          url
        })
        throw new Error(`Stream request failed: ${response.status} ${response.statusText}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      // Read the stream in a loop
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          console.log('Stream complete')
          onClose('Stream complete')
          break
        }

        const chunk = decoder.decode(value)
        console.log('Received chunk:', chunk)

        const lines = chunk.split('\n').filter(line => line.trim())
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonData = JSON.parse(line.slice(6))
              console.log('Parsed stream data:', jsonData)
              onUpdate(jsonData)
            } catch (error) {
              console.error('Error parsing stream data:', error, 'Raw line:', line)
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error)
      onError(error)
    }
  }
}

// Single instance of the client for convenience
const langflowClientInstance = new LangflowClient()

/**
 * Example Vue composable for using the client.
 * You’d import and use this in your Vue components.
 */
export function useLangflow() {
  const chatHistory = ref([])
  const isLoading   = ref(false)
  const error       = ref(null)

  const runFlow = async (message, options = {}) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await langflowClientInstance.initiateSession(
        message,                  // current message
        chatHistory.value,        // all previous messages
        'chat',                   // input_type
        'chat',                   // output_type
        options.stream || false,  // stream?
        options.tweaks || {}      // any custom tweaks
      )
      return response
    } catch (err) {
      error.value = err
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    runFlow,
    isLoading,
    error,
    chatHistory
  }
}