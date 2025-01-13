// langflowClient.js
import { ref } from 'vue'

// In dev, you can prepend the requests with the cors-anywhere proxy
// to help avoid CORS issues. For production, you would remove this or host your own proxy.
const PROXY_URL = 'https://cors-anywhere.herokuapp.com/'

// Read from .env
const LANGFLOW_BASE_URL   = import.meta.env.VITE_LANGFLOW_BASE_URL
const LANGFLOW_FLOW_ID    = import.meta.env.VITE_LANGFLOW_FLOW_ID || 'fallback-flow-id'
const LANGFLOW_API_KEY    = import.meta.env.VITE_LANGFLOW_API_KEY || ''

// Example "English" node structure you provided:
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

  async makeRequest(endpoint, body) {
    // Build full URL
    const url = PROXY_URL + this.baseURL + endpoint

    console.log('Making request to:', url)
    console.log('Request body:', body)

    const headers = {
      "Content-Type": "application/json",
      "x-api-key": this.apiKey
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
        mode: 'cors'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Request failed:', error)
      throw error
    }
  }

  async initiateSession(inputValue, history = [], inputType = 'chat', outputType = 'chat', stream = false, tweaks = {}) {
    // We call /api/v1/run/<flowId>?stream=<bool>
    const endpoint = `/api/v1/run/${this.flowId}?stream=${stream}`

    // Merge user tweaks with default (English) tweaks
    const updatedTweaks = {
      ...DEFAULT_TWEAKS,
      ...tweaks,
      "TextInput-Blns1": {
        "input_value": JSON.stringify(history)  // Chat history
      },
      "TextInput-BXSlv": {
        "input_value": inputValue               // Current user input
      }
    }

    const requestBody = {
      input_type: inputType,
      output_type: outputType,
      tweaks: updatedTweaks
    }

    return this.makeRequest(endpoint, requestBody)
  }

  async handleStream(streamUrl, onUpdate, onClose, onError) {
    // Build full URL for SSE streaming
    const url = PROXY_URL + this.baseURL + streamUrl
    console.log('Streaming from:', url)

    try {
      const response = await fetch(url, {
        headers: {
          'x-api-key': this.apiKey,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
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

// Single client instance, if desired
const langflowClientInstance = new LangflowClient()

/**
 * Example Vue composable (optional).
 * Allows you to easily run flows from a Vue component.
 */
export function useLangflow() {
  const chatHistory = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const runFlow = async (message, options = {}) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await langflowClientInstance.initiateSession(
        message,
        chatHistory.value,
        'chat',
        'chat',
        options.stream || false,
        options.tweaks || {}
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