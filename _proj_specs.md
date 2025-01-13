# Project Specification: AI Chat Application

## Overview
A Vue.js-based chat application that integrates with Langflow for AI-powered conversations. The application uses DataStax's hosted Langflow service for processing and managing chat interactions.

## Technical Stack

### Frontend
- Vue 3 (Composition API)
- component-level CSS for styling
- there is NO tailwind or bootstrap
- Environment variables for configuration

### Backend Services
- Supabase for authentication and database, including chat sessions and history
- DataStax Hosted Langflow for AI processing of chat sessions with RAG
- Environment-based configuration

## Core Components

### Langflow Integration
- Base URL: `https://api.langflow.astra.datastax.com`
- Components:
  - TextInput for chat history
  - TextInput for current messages
  - Prompt template for message formatting
  - OpenAI model for response generation
  - ChatOutput for response handling

### Environment Variables
```env
VITE_LANGFLOW_BASE_URL=/langflow-api
VITE_LANGFLOW_APP_TOKEN=<token>
VITE_LANGFLOW_FLOW_ID=<flow-id>
VITE_LANGFLOW_ID=<langflow-id>
```

### Node IDs (Langflow)
```javascript
{
  "TextInput-QMcYY": {},     // Chat history node
  "ChatInput-pVZoO": {},     // Current message node
  "Prompt-qMrlP": {},        // Prompt template
  "OpenAIModel-4MBLk": {},   // Language model
  "ChatOutput-6NLss": {}     // Output handling
}
```

## Database Schema

# Database Schema

This document outlines the database schema for the chat application.

## Tables

### chat_sessions
Stores information about individual chat sessions.

| Column | Type | Default | Required | Description |
|--------|------|---------|----------|-------------|
| id | uuid | gen_random_uuid() | Yes | Primary identifier for the chat session |
| user_id | uuid | - | No | Reference to the user who owns this session |
| title | text | 'Untitled Session' | No | Display name for the chat session |
| created_at | timestamp | now() | No | When the session was created |
| updated_at | timestamp | now() | No | When the session was last modified |

### chat_history
Stores the individual messages within chat sessions.

| Column | Type | Default | Required | Description |
|--------|------|---------|----------|-------------|
| id | integer | Auto-increment | Yes | Primary identifier for the message |
| session_id | uuid | - | No | Reference to the parent chat session |
| role | text | - | No | The role of the message sender |
| message | text | - | Yes | The content of the message |
| created_at | timestamp | now() | No | When the message was created |

## Relationships

- Each `chat_history` entry belongs to a `chat_sessions` record through the `session_id` foreign key
- A `chat_sessions` record can have multiple `chat_history` entries

## API Structures

### Langflow Request Format
```javascript
{
  
    "TextInput-QMcYY": {
        "input_value": JSON.stringify(history)
    },
    "TextInput-R7rsl": {
        "input_value": "this is a story about a cat in a hat"
    }
  }
}
```

## Data Flow

1. User sends message through Vue component
2. Message is processed through Langflow:
   - Current message gets passed into TextInput node
   - Chat history goes to TextInput node
   - Prompt template processes inputs
   - OpenAI model generates response
   - Response returns through ChatOutput
3. Messages are stored in database
4. UI updates with response

## Key Features

- Real-time chat interface
- Chat history persistence
- Error handling and retry logic
- Message metadata tracking
- Conversation management

## Proxy Configuration

Vite server proxy setup for handling CORS and routing:
```javascript
{
  '/langflow-api': {
    target: 'https://api.langflow.astra.datastax.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/langflow-api/, '')
  }
}
```