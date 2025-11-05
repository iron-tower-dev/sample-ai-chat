# Feedback API Integration

## Overview

Feedback submission is integrated with the same backend as the chat API, allowing users to provide positive or negative feedback on assistant responses.

## API Endpoint

**URL**: `${environment.apiUrl}/feedback`
**Method**: POST
**Content-Type**: application/json

## Request Payload

```typescript
interface FeedbackRequest {
  message_id: string;              // Required: ID of the message being rated
  feedback_sign: 'positive' | 'negative' | 'neutral';  // Required: Type of feedback
  feedback_text?: string;          // Optional: Additional comment from user
}
```

### Example Request

```json
{
  "message_id": "abc123xyz",
  "feedback_sign": "positive",
  "feedback_text": "Very helpful and accurate response!"
}
```

## Implementation

### Services

#### LlmApiService (`src/app/services/llm-api.service.ts`)

Contains the `submitFeedback()` method that sends POST requests to the feedback endpoint:

```typescript
async submitFeedback(feedback: FeedbackRequest): Promise<void> {
  const response = await fetch(`${environment.apiUrl}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(feedback),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}
```

#### ChatService (`src/app/services/chat.service.ts`)

Handles the feedback submission flow:
1. Creates feedback object with metadata
2. Updates message locally with feedback
3. Saves to localStorage
4. Calls LlmApiService to send to backend

```typescript
async submitFeedback(messageId: string, type: 'positive' | 'negative', comment?: string): Promise<void> {
  // Create feedback object
  const feedback: MessageFeedback = {
    id: this.generateId(),
    messageId,
    type,
    timestamp: new Date(),
    comment
  };

  // Update message locally
  this.conversations.update(convs =>
    convs.map(conv => ({
      ...conv,
      messages: conv.messages.map(msg =>
        msg.id === messageId ? { ...msg, feedback } : msg
      )
    }))
  );

  // Save to localStorage
  this.saveConversations();

  // Send to backend
  await this.llmApi.submitFeedback({
    message_id: messageId,
    feedback_sign: type,
    feedback_text: comment
  });
}
```

### UI Flow

1. **User views assistant message**
   - Thumbs up/down buttons appear on hover

2. **User clicks feedback button**
   - Dialog opens requesting optional comment

3. **User submits feedback**
   - Message updated with feedback indicator
   - Feedback buttons replaced with confirmation message
   - Request sent to backend API

4. **Feedback confirmation displayed**
   - Green for positive feedback
   - Red for negative feedback
   - Shows comment if provided

## Components

### MessageComponent (`src/app/components/message/message.component.ts`)

Displays feedback buttons and handles user interaction:

```typescript
@if (message().role === 'assistant' && !message().feedback) {
  <div class="message-actions">
    <button (click)="submitFeedback('positive')" matTooltip="Good response">
      <mat-icon>thumb_up_outline</mat-icon>
    </button>
    <button (click)="submitFeedback('negative')" matTooltip="Poor response">
      <mat-icon>thumb_down_outline</mat-icon>
    </button>
  </div>
}
```

### FeedbackDialogComponent (`src/app/components/feedback-dialog/feedback-dialog.component.ts`)

Modal dialog for collecting optional feedback comment:

```typescript
interface FeedbackDialogData {
  messageId: string;
  type: 'positive' | 'negative';
}

interface FeedbackDialogResult {
  messageId: string;
  type: 'positive' | 'negative';
  comment?: string;
}
```

## Data Models

### MessageFeedback (Local)

Stored with the message in the conversation:

```typescript
interface MessageFeedback {
  id: string;           // Local feedback ID
  messageId: string;    // Message being rated
  type: 'positive' | 'negative';
  timestamp: Date;      // When feedback was submitted
  comment?: string;     // Optional user comment
}
```

### FeedbackRequest (API)

Sent to the backend:

```typescript
interface FeedbackRequest {
  message_id: string;
  feedback_sign: 'positive' | 'negative' | 'neutral';
  feedback_text?: string;
}
```

## Environment Configuration

Feedback endpoint uses the same base URL as chat:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8001'  // Base URL for all API calls
};
```

Full feedback URL: `http://localhost:8001/feedback`

## Error Handling

Errors during feedback submission are:
1. Logged to console
2. Thrown as exceptions
3. Can be caught by calling code for user notification

```typescript
try {
  await this.chatService.submitFeedback(messageId, 'positive', 'Great response!');
} catch (error) {
  console.error('Failed to submit feedback:', error);
  // Optionally show error message to user
}
```

## Persistence

Feedback is stored in two places:

1. **LocalStorage** (immediate)
   - Feedback object stored with message
   - Survives page refreshes
   - Used to display feedback state in UI

2. **Backend API** (async)
   - Sent via POST request
   - Used for analytics and model improvement
   - Independent of local storage

## Testing

### Manual Testing

1. Start the application
2. Send a message to get an assistant response
3. Hover over the assistant message to see feedback buttons
4. Click thumbs up or thumbs down
5. Optionally enter a comment in the dialog
6. Submit feedback
7. Verify:
   - Feedback buttons disappear
   - Confirmation message appears
   - Network request sent to `/feedback` endpoint
   - Feedback persists after page refresh

### Console Verification

Check browser DevTools Network tab:
- Method: POST
- URL: `http://localhost:8001/feedback`
- Request payload contains: `message_id`, `feedback_sign`, `feedback_text`
- Status: 200 OK

## Future Enhancements

Potential improvements:

1. **Retry logic** - Automatically retry failed submissions
2. **Offline queue** - Queue feedback when offline, send when reconnected
3. **Feedback analytics** - Display aggregate feedback to users
4. **Edit feedback** - Allow users to modify submitted feedback
5. **Additional feedback types** - Support for more granular feedback (accuracy, helpfulness, etc.)
6. **Feedback on sources** - Rate individual cited documents
7. **Bulk feedback** - Submit feedback for multiple messages at once

## Files Modified

1. **Created/Updated:**
   - `src/app/services/llm-api.service.ts` - Added `submitFeedback()` method and `FeedbackRequest` interface
   
2. **Updated:**
   - `src/app/services/chat.service.ts` - Updated to use `LlmApiService.submitFeedback()`, removed HttpClient
   - `src/app/models/chat.models.ts` - Removed duplicate `FeedbackRequest` interface

3. **Existing (Unchanged):**
   - `src/app/components/message/message.component.ts` - Feedback UI and interaction
   - `src/app/components/feedback-dialog/feedback-dialog.component.ts` - Feedback dialog

## Related Documentation

- `LLM-API-INTEGRATION.md` - NDJSON streaming chat API
- `INLINE-SOURCE-CITATIONS.md` - Source citation display
- `WARP.md` - Project development guidelines
