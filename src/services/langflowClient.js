import { ref } from 'vue';

// If you have a proxy for local development, you can keep this logic;
// otherwise, set LANGFLOW_BASE_URL directly from the environment.
const PROXY_URL = import.meta.env.PROD
  ? import.meta.env.VITE_LANGFLOW_BASE_URL // Use the deployed URL if in production
  : '/langflow-api'; // Use local proxy path if in development

// Fallback to PROXY_URL if VITE_LANGFLOW_BASE_URL is not set.
const LANGFLOW_BASE_URL = import.meta.env.VITE_LANGFLOW_BASE_URL || PROXY_URL;
const LANGFLOW_APP_TOKEN = import.meta.env.VITE_LANGFLOW_APP_TOKEN;
const DEFAULT_FLOW_ID =
  import.meta.env.VITE_LANGFLOW_FLOW_ID || '070344b2-b674-4f31-80be-3db230cdca20';
const DEFAULT_LANGFLOW_ID =
  import.meta.env.VITE_LANGFLOW_ID || '11b90eb6-ef3a-43d8-b7ed-5481f457e157';

export const DEFAULT_TWEAKS = {
  'TextInput-Blns1': {},
  'Prompt-Nsqv8': {},
  'TextInput-BXSlv': {},
  'OpenAIEmbeddings-LMnen': {},
  'AstraDB-VbzvD': {},
  'ParseData-FVoPT': {},
  'ConditionalRouter-Ew6K8': {},
  'OpenAIModel-MeEBp': {},
  'ChatOutput-hefZs': {},
  'ChatOutput-eguhz': {},
  'ChatInput-QDPr8': {},
  'Prompt-XhNxo': {},
};

export class LangflowClient {
  constructor(baseURL, applicationToken) {
    // Use the resolved LANGFLOW_BASE_URL in production or fallback in dev
    this.baseURL = import.meta.env.PROD ? LANGFLOW_BASE_URL : '/langflow-api';
    this.applicationToken = applicationToken;
  }

  async makeRequest(endpoint, body) {
    // Remove any local '/langflow-api' prefix from the endpoint
    const cleanEndpoint = endpoint.replace('/langflow-api', '');
    const url = `${LANGFLOW_BASE_URL}${cleanEndpoint}`;

    console.log('Making request to:', url);
    console.log('Request body:', body);

    const headers = {
      'x-api-key': this.applicationToken, // Use x-api-key for authentication
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        mode: 'cors',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `${response.status} ${response.statusText} - ${JSON.stringify(
            errorData
          )}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  async initiateSession(
    flowId,
    langflowId,
    inputValue,
    history = [],
    inputType = 'chat',
    outputType = 'chat',
    stream = false,
    tweaks = {}
  ) {
    const endpoint = `/lf/${langflowId}/api/v1/run/${flowId}?stream=${stream}`;

    // Merge or override default tweaks as needed
    const updatedTweaks = {
      ...tweaks,
      'TextInput-Blns1': {
        input_value: JSON.stringify(history),
      },
      'Prompt-Nsqv8': {},
      'TextInput-BXSlv': {
        input_value: inputValue,
      },
      'OpenAIEmbeddings-LMnen': {},
      'AstraDB-VbzvD': {},
      'ParseData-FVoPT': {},
      'ConditionalRouter-Ew6K8': {},
      'OpenAIModel-MeEBp': {},
      'ChatOutput-hefZs': {},
      'ChatOutput-eguhz': {},
      'ChatInput-QDPr8': {},
      'Prompt-XhNxo': {},
    };

    const requestBody = {
      input_type: inputType,
      output_type: outputType,
      tweaks: updatedTweaks,
    };

    return this.makeRequest(endpoint, requestBody);
  }

  async handleStream(langflowId, streamUrl, onUpdate, onClose, onError) {
    const url = import.meta.env.PROD
      ? `${LANGFLOW_BASE_URL}/lf/${langflowId}${streamUrl}`
      : `/langflow-api/lf/${langflowId}${streamUrl}`;

    try {
      const response = await fetch(url, {
        headers: {
          'x-api-key': this.applicationToken, // Use x-api-key for authentication
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Stream response error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          url,
        });
        throw new Error(
          `Stream request failed: ${response.status} ${response.statusText}`
        );
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

        // Each event line is separated by newlines.
        const lines = chunk.split('\n').filter((line) => line.trim());
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              // Strip off "data: "
              const jsonData = JSON.parse(line.slice(6));
              console.log('Parsed stream data:', jsonData);
              onUpdate(jsonData);
            } catch (error) {
              console.error(
                'Error parsing stream data:',
                error,
                'Raw line:',
                line
              );
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

const langflowClientInstance = new LangflowClient(
  LANGFLOW_BASE_URL,
  LANGFLOW_APP_TOKEN
);

export function useLangflow() {
  const chatHistory = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  const runFlow = async (message, options = {}) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await langflowClientInstance.initiateSession(
        DEFAULT_FLOW_ID,
        DEFAULT_LANGFLOW_ID,
        message,
        chatHistory.value,
        'chat',
        'chat',
        options.stream || false,
        options.tweaks || DEFAULT_TWEAKS
      );

      return response;
    } catch (err) {
      error.value = err;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    runFlow,
    isLoading,
    error,
    chatHistory,
  };
}