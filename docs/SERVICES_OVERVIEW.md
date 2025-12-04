# Services Overview

This document provides a high-level overview of all services in the Angular chat application. Services handle business logic, state management, and external communication.

## Table of Contents
- [ChatService](#chatservice)
- [DocumentService](#documentservice)
- [LlmApiService](#llmapiservice)
- [MarkdownRendererService](#markdownrendererservice)
- [ThemeService](#themeservice)
- [UserConfigService](#userconfigservice)
- [SidebarService](#sidebarservice)
- [SourceCitationService](#sourcecitationservice)
- [PdfViewerService](#pdfviewerservice)

---

## ChatService

**Location**: `src/app/services/chat.service.ts`

**Purpose**: Central service managing all chat functionality including conversations, messages, and communication with the LLM backend.

### Key Responsibilities
- Manage conversation lifecycle (create, select, delete)
- Handle message sending with streaming SSE responses
- Store and retrieve conversations from localStorage
- Process feedback submission
- Coordinate with LlmApiService for API communication

### State Management
Uses Angular Signals for reactive state:
- `conversations` - Array of all conversations
- `currentConversationId` - ID of the active conversation
- `documentSources` - Available document sources for RAG
- `isLoading` - Loading state during message processing

### Computed Signals
- `currentConversation` - Returns the active conversation object
- `currentMessages` - Returns messages for the active conversation
- `hasConversations` - Boolean indicating if any conversations exist

### Key Methods

#### `sendMessage(message: string): Promise<void>`
Sends a user message to the LLM API with streaming support.

**Process**:
1. Creates user message and adds to conversation
2. Builds LLM API request with user query, username, and session ID
3. Creates placeholder assistant message for streaming updates
4. Calls LlmApiService with callback to handle streaming chunks
5. Updates message content, thinking text, tooling text, and citations in real-time
6. Extracts and stores API message ID for feedback
7. Updates conversation title from followup questions topic (if new conversation)

**Streaming Callback**:
- Processes thinking text (internal reasoning)
- Processes tooling text (tool/action descriptions)
- Processes response text (final answer)
- Extracts citation metadata for source documents
- Extracts followup questions

#### `createNewConversation(title?: string): string`
Creates a new conversation with optional title.

**Returns**: Conversation ID

**Side Effects**:
- Adds conversation to state
- Sets as current conversation
- Persists to localStorage

#### `selectConversation(conversationId: string): void`
Switches the active conversation by ID.

#### `deleteConversation(conversationId: string): void`
Removes a conversation from storage.

**Side Effects**:
- If deleting current conversation, selects first remaining or sets to null
- Updates localStorage

#### `submitFeedback(messageId: string, type: 'positive' | 'negative', comment?: string): Promise<void>`
Submits feedback for an assistant message.

**Process**:
1. Finds message by ID to get API message ID
2. Creates feedback object and updates message
3. Persists to localStorage
4. Calls LlmApiService feedback endpoint

**Error Handling**:
- Throws if message not found
- Throws if API message ID not available (older messages)

### Data Flow
```
User Input → ChatService.sendMessage() 
  → LlmApiService.sendMessage() (SSE stream)
    → Streaming callbacks update message state
      → UI reflects real-time updates via signals
        → Final response saved to localStorage
```

### Integration Points
- **LlmApiService**: API communication
- **UserConfigService**: User identity for API requests
- **localStorage**: Conversation persistence

---

## DocumentService

**Location**: `src/app/services/document.service.ts`

**Purpose**: Manages RAG (Retrieval-Augmented Generation) document integration, including document sources, filters, and user authorization.

### Key Responsibilities
- Manage document sources and authorization
- Filter documents by source and metadata
- Handle document search (to be implemented)
- Control access based on user group membership

### State Management
- `documents` - Array of RAG documents
- `selectedSources` - User-selected document sources
- `selectedFilters` - Applied metadata filters
- `userGroups` - User's AD group memberships for authorization

### Computed Signals

#### `availableSources`
Returns document sources accessible to the current user based on:
- Public sources (no auth required)
- Internal sources where user belongs to allowed groups

#### `filteredDocuments`
Returns documents matching:
- Selected sources (if any)
- Applied metadata filters (exact or partial match)

#### `availableMetadataFields`
Returns all metadata field names present in filtered documents.

### Key Methods

#### `selectSource(sourceId: string, selected: boolean): void`
Toggles source selection for filtering.

#### `setFilter(field: string, value: any): void`
Applies a metadata filter. Supports:
- String partial matching (case-insensitive)
- Exact matching for other types

#### `clearFilters(): void`
Removes all metadata filters.

#### `clearSourceSelection(): void`
Deselects all document sources.

#### `getDocumentById(id: string): RAGDocument | undefined`
Retrieves a specific document by ID.

#### `getDocumentsBySource(sourceId: string): RAGDocument[]`
Returns all documents from a specific source.

#### `getMetadataValues(field: string): any[]`
Returns all unique values for a metadata field across documents.

#### `loadDocuments(): Promise<void>` ⚠️ TODO
Placeholder for loading documents from backend API.

#### `searchDocuments(query: string): Promise<RAGDocument[]>` ⚠️ TODO
Placeholder for document search functionality.

### Authorization Model
Documents are authorized based on:
- **External sources**: No authentication required
- **Internal sources**: User must belong to at least one allowed group

### Sample Data Structure
```typescript
DocumentSource {
  id: 'internal-docs',
  name: 'Internal Documentation',
  type: 'internal',
  requiresAuth: true,
  allowedGroups: ['engineers', 'managers', 'admins']
}

RAGDocument {
  id: 'doc-1',
  title: 'API Reference Guide',
  content: 'Complete API reference...',
  source: DocumentSource,
  metadata: {
    dateAdded: Date,
    documentName: string,
    pageNumber: number,
    author: string,
    category: string,
    tags: string[]
  },
  pageNumber: number
}
```

### Future Enhancements
- API integration for loading documents
- Search functionality with backend
- Real-time AD group checking
- Document preview and download

---

## LlmApiService

**Location**: `src/app/services/llm-api.service.ts`

**Purpose**: Low-level service handling HTTP communication with the LLM backend API using Server-Sent Events (SSE) for streaming responses.

### Key Responsibilities
- Send user queries to LLM API with GET requests
- Parse SSE streaming responses in real-time
- Extract thinking, tooling, and response text from streams
- Parse metadata and followup questions
- Handle tool call events
- Submit user feedback to API

### Key Methods

#### `sendMessage(request: LLMRequest, onChunk: Function, abortSignal?: AbortSignal): Promise<void>`
Sends a message to the LLM API and streams the response.

**Parameters**:
- `request`: Contains user_query, username, session_id
- `onChunk`: Callback invoked for each streaming update
- `abortSignal`: Optional signal to cancel the request

**SSE Stream Processing**:

The service parses the SSE stream and extracts:

1. **Thinking Text** (`<think>...</think>`)
   - Internal reasoning of the LLM
   - Not shown in final response (collapsed by default in UI)

2. **Tooling Text** (`<tooling>...</tooling>` or `(tool: "...")`)
   - Tool/action descriptions
   - Shown as loading indicator during generation
   - Supports both legacy XML tags and inline format

3. **Response Text** (`<response>...</response>`)
   - Final answer to user
   - Rendered as markdown with citations

4. **Metadata** (`metadata: {...}`)
   - Document citation metadata
   - Maps citation IDs to document info
   - Contains chunks, bounding boxes, relevance scores

5. **Followup Questions** (`followup_questions: {...}`)
   - Suggested related questions
   - Contains topic and array of followup strings

6. **Tool Events** (`tool: {...}`)
   - Discrete tool call events
   - Contains action description

**Header Extraction**:
- Extracts `X-Message-Id` header for feedback tracking

**Chunk Processing**:
The service uses a tag buffer to handle XML tags that may be split across SSE chunks:
- Accumulates partial content until complete tags are detected
- Processes content within tags and updates state
- Clears buffer after processing

**Double-Encoded JSON Handling**:
Metadata, followup questions, and tool events may be double-encoded (JSON string containing JSON). The service automatically detects and parses twice if needed.

#### `submitFeedback(feedback: FeedbackRequest): Promise<void>`
Submits user feedback for a message.

**Request Structure**:
```typescript
{
  message_id: string,      // API message ID from X-Message-Id header
  feedback_sign: 'positive' | 'negative' | 'neutral',
  feedback_text: string    // Optional comment
}
```

**Endpoint**: `POST /feedback`

### Data Structures

#### LLMRequest
```typescript
{
  user_query: string,
  username: string,
  session_id: string
}
```

#### StreamingResponse
```typescript
{
  chunks: LLMResponseChunk[],     // All chunks received
  currentChunk: LLMResponseChunk, // Latest chunk
  isComplete: boolean,            // Stream finished
  error?: Error,                  // Error if any
  messageId?: string              // From X-Message-Id header
}
```

#### LLMResponseChunk
```typescript
{
  thinkingText: string,
  toolingText: string,
  responseText: string,
  metadata?: Record<string, any>,
  followupQuestions?: { topic: string, followups: string[] },
  isComplete: boolean
}
```

### SSE Format Example
```
data: <think>
data: Analyzing the user's question...
data: </think>
data: <tooling>
data: Searching documentation
data: </tooling>
data: <response>
data: Here is the answer...
data: </response>
metadata: {"doc-uuid-1": {...}}
followup_questions: {"topic": "...", "followups": [...]}
tool: {"action": "Retrieved 5 documents"}
```

### Error Handling
- HTTP errors throw with status code
- Parsing errors logged to console
- Malformed JSON gracefully handled
- Stream errors passed to callback

### Configuration
- API URL from environment config
- Can be changed with `setApiUrl(url: string)`

---

## MarkdownRendererService

**Location**: `src/app/services/markdown-renderer.service.ts`

**Purpose**: Renders markdown content with LaTeX math support and HTML sanitization.

### Key Responsibilities
- Convert markdown to HTML using `marked` library
- Render LaTeX math expressions with KaTeX
- Sanitize HTML to prevent XSS attacks
- Handle both inline and display math
- Preserve code blocks during processing

### Key Methods

#### `renderMarkdown(markdown: string): Promise<string>`
Main rendering method that processes markdown with math support.

**Process**:
1. Extract and protect code blocks with placeholders
2. Process inline math (`$...$`) outside code blocks
3. Restore code blocks and process display math
4. Render markdown to HTML with `marked`
5. Sanitize with DOMPurify

**Returns**: Sanitized HTML string

### Math Rendering

#### Inline Math
- Delimited by single `$` signs: `$E = mc^2$`
- Rendered inline with text
- Custom CSS adjustments for proper positioning
- Line height fixes to prevent extra spacing

#### Display Math
- Code blocks with `latex` or `math` language
- Rendered in block format (centered, larger)
- Full KaTeX display mode

**Example**:
````markdown
The equation $E = mc^2$ demonstrates...

```latex
\int_{a}^{b} f(x) \, dx = F(b) - F(a)
```
````

### KaTeX Customization
The service applies CSS modifications to fix positioning issues:
- Adjusts superscript/subscript positioning
- Reduces strut heights to prevent extra line spacing
- Centers display math blocks
- Applies baseline alignment for inline math

### HTML Sanitization
Uses DOMPurify with custom configuration:
- **Allowed attributes**: `style`, `xmlns`, `aria-hidden`, `title`, `data-doc`, `data-preview`
- **Allowed tags**: All MathML tags for KaTeX output
- **Data attributes**: Enabled for citation linking
- **Content**: Preserved (KEEP_CONTENT: true)

### Code Block Protection
Code blocks are protected during inline math processing to prevent false matches:
1. Extract all code blocks with regex
2. Replace with placeholders (`__CODE_BLOCK_N__`)
3. Process inline math in non-code content
4. Restore code blocks with proper rendering

### Utility Methods

#### `containsMath(content: string): boolean`
Checks if content contains math expressions:
- Inline math: `$...$`
- Display math: ` ```latex` or ` ```math`

#### `containsMarkdown(content: string): boolean`
Checks if content contains markdown syntax:
- Common markers: `*`, `_`, `` ` ``, `#`, `[`, `]`, `(`
- Code blocks: ` ``` `

### Error Handling
- LaTeX errors render as `<code class="math-error">$...$</code>`
- Markdown errors display error message
- Errors logged to console for debugging

### Dependencies
- **marked**: Markdown parser
- **KaTeX**: LaTeX math rendering
- **DOMPurify**: HTML sanitization

---

## ThemeService

**Location**: `src/app/services/theme.service.ts`

**Purpose**: Manages application theming including light/dark modes and color schemes.

### Key Responsibilities
- Load and apply user theme preferences
- Toggle between light and dark themes
- Persist theme selection to localStorage
- Apply environment watermarks (dev/test/prod)
- Manage CSS class application

### State Management
- `currentThemeId` - Signal containing active theme ID

### Theme Model
Themes are defined in `src/app/models/theme.models.ts`:
```typescript
interface Theme {
  id: string,
  name: string,
  mode: 'light' | 'dark',
  baseName: string,    // e.g., 'blue-purple'
  cssClass: string,    // Applied to body element
  primary: string,     // CSS color
  accent: string       // CSS color
}
```

### Available Themes
- **blue-purple-light**: Light mode with blue/purple accent
- **blue-purple-dark**: Dark mode with blue/purple accent
- Additional themes can be added to THEMES array

### Key Methods

#### `setTheme(themeId: string): void`
Applies a theme by ID.

**Side Effects**:
- Updates currentThemeId signal
- Triggers effect to apply CSS classes
- Persists to localStorage

#### `toggleTheme(): void`
Switches between light and dark modes while keeping the same color scheme.

**Logic**:
- Finds current theme's opposite mode (light ↔ dark)
- Matches by baseName to keep colors consistent
- Applies the opposite theme

#### `getThemeById(id: string): Theme | undefined`
Retrieves a theme definition by ID.

### Theme Application

The service uses Angular effects to automatically apply themes:

**On Initialization**:
1. Load saved theme from localStorage
2. Fall back to system preference if no saved theme
3. Apply theme immediately with setTimeout
4. Add environment watermark

**On Theme Change**:
1. Remove all existing theme CSS classes
2. Add new theme CSS class to body
3. Set `color-scheme` CSS property
4. Save to localStorage

### Environment Watermarks
Visual indicators for different environments:
- **dev-watermark**: Development environment
- **test-watermark**: Testing environment
- **prod-watermark**: Production environment

Applied as CSS classes to body element.

### CSS Integration
Themes work with CSS custom properties defined in `src/styles.css`:
```css
.blue-purple-light {
  --primary-color: #3f51b5;
  --accent-color: #9c27b0;
  --background-color: #fafafa;
  --text-color: #212121;
}
```

### System Preference Detection
```typescript
window.matchMedia('(prefers-color-scheme: dark)').matches
```

Used as fallback when no saved theme exists.

### Persistence
- **Storage**: localStorage
- **Key**: `selected-theme-id`
- **Format**: Simple theme ID string

---

## UserConfigService

**Location**: `src/app/services/user-config.service.ts`

**Purpose**: Manages user configuration and identity for API requests.

### Key Responsibilities
- Provide user identification
- Store user preferences
- Manage user session data
- Supply user info to other services

### State Management
Likely contains:
- `userId` - User identifier
- User preferences
- Session information

### Integration
Used by ChatService to include username in API requests.

**Note**: Full implementation details should be reviewed in source file.

---

## SidebarService

**Location**: `src/app/services/sidebar.service.ts`

**Purpose**: Controls sidebar visibility and state for responsive layouts.

### Key Responsibilities
- Manage sidebar open/closed state
- Handle responsive behavior
- Coordinate with layout components

### Typical Usage
```typescript
sidebarService.toggle();     // Toggle open/closed
sidebarService.open();       // Open sidebar
sidebarService.close();      // Close sidebar
sidebarService.isOpen$();    // Observable/signal of state
```

**Note**: Full implementation details should be reviewed in source file.

---

## SourceCitationService

**Location**: `src/app/services/source-citation.service.ts`

**Purpose**: Manages document citations and source linking in responses.

### Key Responsibilities
- Parse citation metadata from LLM responses
- Link citation IDs to document chunks
- Provide document preview data
- Handle citation click events

### Expected Functionality
- Extract citation markers from text (e.g., `[1]`, `[doc-id]`)
- Map citations to source documents
- Provide hover preview data
- Open citation modals

**Note**: Full implementation details should be reviewed in source file.

---

## PdfViewerService

**Location**: `src/app/services/pdf-viewer.service.ts`

**Purpose**: Handles PDF document viewing and navigation.

### Key Responsibilities
- Load PDF documents
- Navigate to specific pages
- Highlight bounding boxes in PDFs
- Manage PDF viewer state

### Expected Functionality
- Open PDF in viewer
- Jump to page number
- Highlight text regions based on bounding box coordinates
- Handle PDF loading states

**Note**: Full implementation details should be reviewed in source file.

---

## Service Dependencies

```
ChatService
  ├── LlmApiService (API communication)
  └── UserConfigService (user identity)

DocumentService
  └── (Independent)

LlmApiService
  └── Environment config

MarkdownRendererService
  └── (Independent - uses libraries)

ThemeService
  ├── DOCUMENT token (DOM access)
  └── Environment config

UserConfigService
  └── (Independent)

SidebarService
  └── (Independent)

SourceCitationService
  └── DocumentService (likely)

PdfViewerService
  └── (Independent)
```

## Best Practices for Service Usage

### 1. Inject Services with `inject()` Function
```typescript
private chatService = inject(ChatService);
```

### 2. Use Signals for Reactive State
```typescript
// Read state
const messages = this.chatService.currentMessages$();

// Computed values
readonly messageCount = computed(() => this.messages().length);
```

### 3. Handle Async Operations
```typescript
try {
  await this.chatService.sendMessage(message);
} catch (error) {
  console.error('Failed to send message:', error);
  // Handle error appropriately
}
```

### 4. Unsubscribe Not Needed
Services use signals, not RxJS observables, so no subscription management needed.

### 5. Service Lifecycle
All services use `providedIn: 'root'` making them application-wide singletons.

## Common Patterns

### Loading States
```typescript
if (this.chatService.isLoading$()) {
  // Show loading indicator
}
```

### Error Handling
```typescript
try {
  await service.operation();
} catch (error) {
  // Log error
  console.error('Operation failed:', error);
  // Show user notification
  this.showError('Operation failed');
}
```

### Computed Values
```typescript
readonly isEmpty = computed(() => 
  this.chatService.currentMessages$().length === 0
);
```

## Testing Services

Services can be tested with Angular TestBed:
```typescript
TestBed.configureTestingModule({
  providers: [ChatService]
});
const service = TestBed.inject(ChatService);
```

Mock dependencies:
```typescript
TestBed.configureTestingModule({
  providers: [
    ChatService,
    { provide: LlmApiService, useValue: mockLlmApi }
  ]
});
```
