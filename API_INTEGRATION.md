# API Integration Documentation

This document describes the integration of the Angular chat application with the backend API at `http://localhost:8001`.

## Changes Made

### 1. Data Models (`src/app/models/chat.models.ts`)

Updated interfaces to match the API specification:

#### ChatRequest
```typescript
interface ChatRequest {
    user_id: string;           // e.g., "z12345"
    ad_group: string;          // e.g., "nuclear_engineers"
    prompt: string;            // The user's message
    thread_id: string;         // Conversation/thread identifier
    session_id: string;        // Unique session ID
    system_prompt?: string;    // Optional system prompt
    persona?: string;          // Optional persona
    tool_override?: 'searchdoc' | 'querydb';
    filtered_dataset?: any;    // Optional dataset filters
    metadata_filters?: any;    // Optional metadata filters
}
```

#### ChatResponse
```typescript
interface ChatResponse {
    thread_id: string;
    tool_call_reasoning: string;
    generated_reasoning: string;
    generated_response: string;      // Main response text to display
    guardrail_reasoning: string;
    guardrail_response: string;
    cited_sources: CitedSource[];    // Sources used in response
    retrieved_sources: RetrievedSource[];
    topic: string;                   // Used for conversation title
    summary: string;
    retrieval_time: number;
    generation_time: number;
    guardrail_time: number;
}
```

#### FeedbackRequest
```typescript
interface FeedbackRequest {
    thread_id: string;
    message_id: string;
    feedback_sign: 'positive' | 'negative' | 'neutral';
    feedback_text?: string;
}
```

### 2. User Configuration Service (`src/app/services/user-config.service.ts`)

Created a new service to manage user identity:
- Stores `user_id` and `ad_group` in signals
- Persists values to localStorage
- Default values: `user123` and `nuclear_engineers`

**Usage**: Can be extended to get user info from authentication service or user profile.

### 3. Chat Service Updates (`src/app/services/chat.service.ts`)

#### Key Changes:
- **HTTP Integration**: Added `HttpClient` injection and `firstValueFrom` for API calls
- **Real API Calls**: Replaced `simulateAPIResponse()` with `callChatAPI()`
- **Response Mapping**: Added `convertToRAGDocuments()` to transform `cited_sources` into `RAGDocument[]`
- **Feedback Integration**: Updated `submitFeedback()` to POST to `/feedback` endpoint
- **Conversation Titles**: Auto-generates titles from API response `topic` field

#### API Endpoints:

**POST /chat**
```typescript
const response = await this.http.post<ChatResponse>(
    `${environment.apiUrl}/chat`, 
    request
);
```

**POST /feedback**
```typescript
await this.http.post(
    `${environment.apiUrl}/feedback`, 
    feedbackRequest
);
```

### 4. Environment Configuration

Updated `src/environments/environment.ts` and `environment.prod.ts`:
```typescript
export const environment = {
    production: false,
    testing: false,
    apiUrl: 'http://localhost:8001'
};
```

### 5. App Configuration (`src/app/app.config.ts`)

Added `provideHttpClient()` to enable HTTP functionality across the app.

## How It Works

### Sending a Message

1. User types message and clicks send
2. `ChatService.sendMessage()` is called
3. Service creates `ChatRequest` with:
   - `user_id` and `ad_group` from `UserConfigService`
   - `thread_id` (conversation ID)
   - `session_id` (unique per message)
   - User's `prompt`
   - Optional `tool_override` and filters
4. POST to `/chat` endpoint
5. API response parsed:
   - `generated_response` becomes message content
   - `cited_sources` converted to `RAGDocument[]`
   - `topic` used for conversation title (first message)
6. Message added to conversation and saved

### Submitting Feedback

1. User clicks thumbs up/down on a message
2. `ChatService.submitFeedback()` called
3. Creates `FeedbackRequest` with:
   - `thread_id` (current conversation)
   - `message_id`
   - `feedback_sign` ('positive' | 'negative')
   - Optional `feedback_text`
4. POST to `/feedback` endpoint
5. Feedback saved locally and synced with API

### RAG Document Integration

Cited sources from API are automatically converted to RAG documents:
```typescript
{
    id: generated_id,
    title: metadata.documentName,
    content: source.text,
    source: { id, name, type, requiresAuth },
    metadata: { ...all metadata },
    pageNumber: metadata.pageNumber,
    relevanceScore: metadata.relevanceScore
}
```

These are displayed in the UI as document chips with hover previews.

## Testing

1. **Start the API**: Ensure backend is running on `http://localhost:8001`
2. **Start Angular**: `npm start`
3. **Send a message**: Should call `/chat` endpoint
4. **Check network tab**: Verify POST requests
5. **Provide feedback**: Should call `/feedback` endpoint

## Configuration

### Changing User Credentials

Update in localStorage or modify `UserConfigService` defaults:
```typescript
localStorage.setItem('user_id', 'your_user_id');
localStorage.setItem('ad_group', 'your_ad_group');
```

### Changing API URL

Update `src/environments/environment.ts`:
```typescript
apiUrl: 'https://your-api-domain.com'
```

## Future Enhancements

1. **Streaming Responses**: Implement Server-Sent Events (SSE) for streaming
2. **Authentication**: Integrate AD authentication to get real user_id/ad_group
3. **Error Handling**: Add better error messages and retry logic
4. **Document Filtering**: UI for setting `filtered_dataset` and `metadata_filters`
5. **Real-time Metrics**: Display `retrieval_time`, `generation_time`, etc.
