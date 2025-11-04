# LLM API Integration with Streaming NDJSON

This document describes the integration of the LLM API service with streaming NDJSON support using Angular's new resource API.

## Overview

The application now uses a dedicated `LlmApiService` to communicate with the backend LLM API, streaming responses in NDJSON (newline-delimited JSON) format. This replaces the previous simulated API responses.

## Architecture

### Components

1. **LlmApiService** (`src/app/services/llm-api.service.ts`)
   - Handles HTTP communication with the LLM backend
   - Processes streaming NDJSON responses
   - Uses Angular's `resource()` API for reactive data loading

2. **ChatService** (`src/app/services/chat.service.ts`)
   - Orchestrates chat functionality
   - Integrates with `LlmApiService` for message sending
   - Manages conversation state and updates UI reactively

3. **UserConfigService** (`src/app/services/user-config.service.ts`)
   - Provides user identity (`user_id` and `ad_group`)
   - Required for LLM API requests

## Request/Response Format

### Request Payload

The LLM API expects requests in the following format:

```typescript
interface LLMRequest {
  user_id: string;          // User identifier
  ad_group: string;         // Active Directory group
  prompt: string;           // User's message/prompt
  thread_id: string;        // Conversation thread ID
  filtered_dataset: string; // Dataset filter (e.g., "NRCAdams")
}
```

Example:
```json
{
  "user_id": "Z16585",
  "ad_group": "ECM eDoc PV General@apsc.com",
  "prompt": "What is TICAP?",
  "thread_id": "62yop7e50",
  "filtered_dataset": "NRCAdams"
}
```

### Response Format (NDJSON)

The API returns streaming NDJSON responses. Each line is a complete JSON object:

```typescript
interface LLMResponseChunk {
  response: string;              // Full markdown response
  message_id: string;            // Unique message identifier
  tool_call_reasoning: string;   // Tool selection reasoning
  generated_reasoning: string;   // LLM reasoning process
  generated_response: string;    // Generated answer text
  cited_sources: CitedSource[];  // Sources cited in response
  retrieved_sources: RetrievedSource[]; // All retrieved sources
  guardrail_reasoning: string;   // Safety check reasoning
  guardrail_response: string;    // Safety check result
  sources: string;               // Source summary
  topic: string;                 // Conversation topic
  summary: string;               // Response summary
  retrieval_time: number;        // Time spent retrieving docs
  generation_time: number;       // Time spent generating
  guardrail_time: number;        // Time spent on safety checks
}
```

Multiple JSON objects are sent separated by newlines as the response streams.

## How It Works

### 1. Sending a Message

When a user sends a message:

```typescript
// User sends message via ChatService
chatService.sendMessage(
  'What is TICAP?',
  'llama-3.1-70b',
  ['NRCAdams'],
  []
);
```

### 2. Request Creation

The `ChatService` creates an `LLMRequest`:

```typescript
const request: LLMRequest = {
  user_id: this.userConfig.userId$(),
  ad_group: this.userConfig.adGroup$(),
  prompt: message,
  thread_id: threadId,
  filtered_dataset: documentSources?.[0] || ''
};
```

### 3. Streaming Response

The `LlmApiService` uses the Fetch API to stream the response:

```typescript
const streamResource = this.llmApi.sendMessage(request);
```

The resource API automatically:
- Makes the HTTP POST request
- Streams the response body
- Parses NDJSON line by line
- Provides reactive updates via signals

### 4. UI Updates

An Angular `effect()` watches the streaming resource and updates the UI in real-time:

```typescript
effect(() => {
  const streamData = streamResource.value();
  
  if (streamData) {
    const { chunks, isComplete, error } = streamData;
    const latestChunk = chunks[chunks.length - 1];
    
    // Update message content as it streams
    this.updateMessageContent(
      assistantMessageId,
      latestChunk.generated_response
    );
    
    // Update RAG documents when available
    if (latestChunk.cited_sources?.length > 0) {
      this.updateMessageRAGDocuments(
        assistantMessageId,
        this.convertToRAGDocuments(latestChunk.cited_sources)
      );
    }
  }
});
```

## Configuration

### API Endpoint

The API URL is configured in `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  testing: false,
  apiUrl: 'http://localhost:8001'
};
```

The LLM service automatically appends `/chat` to create the full endpoint: `http://localhost:8001/chat`

### Changing the API URL

To use a different API endpoint:

```typescript
// In a service or component
llmApiService.setApiUrl('https://api.example.com/llm/chat');
```

## Benefits of This Architecture

1. **Real-time Streaming**: Users see responses as they're generated, not after completion
2. **Reactive Updates**: Angular signals ensure UI stays in sync with data
3. **Cancellation Support**: Resource API provides built-in request cancellation via `AbortSignal`
4. **Type Safety**: Full TypeScript typing for request/response payloads
5. **Error Handling**: Comprehensive error handling with user-friendly messages
6. **NDJSON Parsing**: Robust line-by-line parsing handles partial chunks correctly

## Error Handling

The service handles various error scenarios:

1. **Network Errors**: Connection failures, timeouts
2. **HTTP Errors**: 4xx, 5xx status codes
3. **Parse Errors**: Invalid JSON in NDJSON stream
4. **Stream Interruption**: Incomplete responses

All errors result in a user-friendly error message displayed in the chat.

## Testing

To test the integration:

1. Start the backend API server on `http://localhost:8001`
2. Run the Angular dev server: `npm start`
3. Open the application and send a message
4. Observe streaming responses in real-time

## Future Enhancements

Potential improvements:

1. **Retry Logic**: Automatic retry on transient failures
2. **Offline Support**: Queue messages when offline
3. **Progress Indicators**: Show streaming progress percentages
4. **Token Counting**: Display token usage per message
5. **Response Caching**: Cache responses for repeated queries
