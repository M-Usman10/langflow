import { ref } from 'vue'

const LANGFLOW_BASE_URL = import.meta.env.VITE_LANGFLOW_BASE_URL || '/langflow-api'
const LANGFLOW_APP_TOKEN = import.meta.env.VITE_LANGFLOW_APP_TOKEN
const DEFAULT_FLOW_ID = import.meta.env.VITE_LANGFLOW_FLOW_ID || ''
const DEFAULT_LANGFLOW_ID = import.meta.env.VITE_LANGFLOW_ID || '11b90eb6-ef3a-43d8-b7ed-5481f457e157'

export const DEFAULT_TWEAKS = {
  "ChatInput-EMZEM": {},
  "ChatOutput-utwrG": {}
}

class LangflowClient {
    constructor(baseURL, applicationToken) {
      this.baseURL = baseURL;
      this.applicationToken = applicationToken;
    }
  
    async initiateSession(flowId, langflowId, inputValue, history = [], inputType = 'chat', outputType = 'chat', stream = false, tweaks = {}) {
      const endpoint = `/lf/${langflowId}/api/v1/run/${flowId}?stream=${stream}`;
  
      // Just use the passed `history` array
      tweaks["Prompt-0rpI3"] = { 
        chat_history: history, 
        input_value: inputValue 
      };
  
      const requestBody = {
        input_value: inputValue,
        input_type: inputType,
        output_type: outputType,
        tweaks: tweaks
      };
  
      const response = await this.makeRequest(endpoint, requestBody);
      return response;
    }
    
    async makeRequest(endpoint, body) {
        const cleanEndpoint = endpoint.replace('/langflow-api', '')
        const url = `${this.baseURL}${cleanEndpoint}`
        
        const headers = {
            "Authorization": `Bearer ${this.applicationToken}`,
            "Content-Type": "application/json"
        }
        
        console.log('Making request to:', url)
        console.log('Headers:', headers)
        console.log('Body:', body)

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(`${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
            }

            const responseData = await response.json()
            console.log('Response data:', responseData)
            return responseData
        } catch (error) {
            console.error('Request failed:', error)
            throw error
        }
    }

    async handleStream(langflowId, streamUrl, onUpdate, onClose, onError) {
        const proxyStreamUrl = `/langflow-api/lf/${langflowId}${streamUrl}`;
    
        try {
            const response = await fetch(proxyStreamUrl, {
                headers: {
                    'Authorization': `Bearer ${this.applicationToken}`,
                    'Accept': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                }
            });
    
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Stream response error:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText,
                    url: proxyStreamUrl
                });
                throw new Error(`Stream request failed: ${response.status} ${response.statusText}`);
            }
    
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
    
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    console.log('Stream complete');
                    onClose('Stream complete');
                    break;
                }
    
                const chunk = decoder.decode(value);
                console.log('Received chunk:', chunk);
                
                const lines = chunk.split('\n').filter(line => line.trim());
    
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const jsonData = JSON.parse(line.slice(6));
                            console.log('Parsed stream data:', jsonData);
                            onUpdate(jsonData);
                        } catch (error) {
                            console.error('Error parsing stream data:', error, 'Raw line:', line);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Stream error:', error);
            onError(error);
        }
    }   
    
}

const langflowClient = new LangflowClient(LANGFLOW_BASE_URL, LANGFLOW_APP_TOKEN)

export function useLangflow() {
    const isLoading = ref(false);
    const error = ref(null);
    const response = ref(null);
    const chatHistory = ref([]);
  
    const updateChatHistory = (newMessage, assistantResponse) => {
      chatHistory.value.push({ role: 'user', content: newMessage });
      if (assistantResponse) {
        chatHistory.value.push({ role: 'assistant', content: assistantResponse });
      }
    };
  
    const runFlow = async (
      inputValue,
      {
        flowId = DEFAULT_FLOW_ID,
        langflowId = DEFAULT_LANGFLOW_ID,
        inputType = 'chat',
        outputType = 'chat',
        chat_history = chatHistory.value, // local state
        tweaks = DEFAULT_TWEAKS,
        stream = false,
        onUpdate = (data) => {
          if (data?.message?.content) {
            updateChatHistory(inputValue, data.message.content);
          }
        },
        onClose = () => {},
        onError = () => {}
      } = {}
    ) => {
      isLoading.value = true;
      error.value = null;
  
      try {
        // Initiate session through langflowClient
        const result = await langflowClient.initiateSession(
          flowId,
          langflowId,
          inputValue,
          chat_history,
          inputType,
          outputType,
          stream,
          tweaks
        );
  
        response.value = result;
  
        // If no streaming, handle the final message
        if (!stream && result?.outputs?.[0]?.outputs?.[0]?.outputs?.message) {
          const responseText = result.outputs[0].outputs[0].outputs.message.message.text;
          updateChatHistory(inputValue, responseText);
          return responseText;
        }
  
        if (stream && result?.outputs?.[0]?.outputs?.[0]?.artifacts?.stream_url) {
          const streamUrl = result.outputs[0].outputs[0].outputs.artifacts.stream_url;
          await langflowClient.handleStream(langflowId, streamUrl, onUpdate, onClose, onError);
          return result;
        }
  
        return result;
      } catch (err) {
        error.value = err.message;
        onError(err);
        throw err;
      } finally {
        isLoading.value = false;
      }
    };
  
    return {
      runFlow,
      isLoading,
      error,
      response,
      chatHistory,
      clearHistory: () => {
        chatHistory.value = [];
      }
    };
  }
  