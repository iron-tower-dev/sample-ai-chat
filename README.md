# AI Chat Assistant

A modern, production-ready chat interface for interacting with on-premises LLM models. Built with Angular 20 and TypeScript, featuring NDJSON streaming responses, inline source citations, RAG document integration, and comprehensive user feedback.

## Features

### Core Chat Functionality
- **NDJSON Streaming**: Real-time streaming responses with character-by-character typing animation
- **Thinking Indicator**: Displays "Thinking" with spinner while waiting for LLM response
- **Model Selection**: Choose from available LLM models (Llama 3.1 8B, Llama 3.1 70B)
- **Real-time Messaging**: Send messages with Enter key or click, with character count (2000 char limit)
- **Markdown Support**: Full markdown rendering with code highlighting
- **LaTeX Support**: Inline and display math rendering with KaTeX

### Conversation Management
- **Conversation History**: Persistent conversation storage in localStorage
- **Multiple Conversations**: Create, switch between, and delete conversations
- **Conversation Sidebar**: Easy navigation between chat sessions
- **Auto-save**: Conversations are automatically saved as you chat

### RAG Document Integration
- **Document Sources**: Support for NRC ADAMS and eDoc document sources
- **Source Selection**: Choose which document sources to use for RAG
- **Inline Source Citations**: Citations replaced with dataset-specific identifiers
  - NRC ADAMS: AccessionNumber (e.g., ML21049A274)
  - eDoc: DocumentTitle (e.g., 20DP-0SK40)
- **Badge-Style Citations**: Modern, interactive citation badges with document icon
- **Multi-Source Support**: Handles complex citations like `[Source: 7, 26, 38]`
- **Citation Parsing**: Intelligently maps source IDs to document titles
- **Hover Effects**: Elevated badges with enhanced styling on hover
- **Click-Ready**: Prepared for future click-to-open document functionality

### User Feedback
- **Response Rating**: Thumbs up/down feedback for AI responses
- **Feedback Dialog**: Optional comment collection with Material Dialog
- **Backend Integration**: POST requests to `/feedback` endpoint
- **Dual Persistence**: Stored locally (localStorage) and sent to backend API
- **Visual Confirmation**: Green/red confirmation with submitted feedback display

### Design & UX
- **Theme Support**: Light and dark themes with system preference detection
- **Responsive Design**: Optimized for desktop and mobile devices
- **Material Design**: Angular Material components throughout
- **Smooth Animations**: Typing animation, hover effects, and transitions
- **Accessibility**: Keyboard navigation, ARIA labels, focus states

## Architecture

### Services
- **ChatService**: Manages conversations, messages, and coordinates LLM interactions
- **LlmApiService**: Handles NDJSON streaming, feedback submission, and API communication
- **MarkdownRendererService**: Renders markdown with KaTeX math and DOMPurify sanitization
- **SourceCitationService**: Parses and replaces inline source citations with document links
- **ThemeService**: Manages light/dark theme with system preference detection
- **UserConfigService**: Manages user ID and AD group information
- **DocumentService**: Handles document sources, filtering, and RAG integration

### Components
- **ChatInterfaceComponent**: Main chat interface with input and message display
- **MessageComponent**: Individual message display with feedback and thinking indicator
- **MarkdownContentComponent**: Renders markdown with inline source citations
- **ConversationSidebarComponent**: Conversation history and management
- **DocumentSelectorComponent**: Document source selection and filtering
- **ModelSelectorComponent**: LLM model selection dropdown
- **FeedbackDialogComponent**: Collects optional feedback comments
- **ThemeToggleComponent**: Light/dark theme switcher

### Data Models
- **ChatMessage**: Message structure with content, role, timestamp, RAG documents, and feedback
- **Conversation**: Conversation container with messages and metadata
- **RAGDocument**: Document structure with title, content, source, metadata, and relevance score
- **DocumentSource**: Source configuration with type (NRCAdams/eDoc) and authorization rules
- **LLMModel**: Model information with availability and token limits
- **LLMRequest**: API request with user_id, ad_group, prompt, thread_id, and filtered_dataset
- **LLMResponseChunk**: NDJSON chunk with generated_response, retrieved_sources, and metadata
- **FeedbackRequest**: Feedback submission with message_id, feedback_sign, and optional text

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm start
```

The application will be available at `http://localhost:4200`

### Building for Production
```bash
npm run build
```

## API Integration

### Backend Configuration
**Base URL**: `http://localhost:8001` (configurable in `environment.ts`)

### Chat API - NDJSON Streaming
- **Endpoint**: `POST /chat`
- **Request Format**:
  ```json
  {
    "user_id": "string",
    "ad_group": "string",
    "prompt": "string",
    "thread_id": "string",
    "filtered_dataset": "NRCAdams" | "eDoc"
  }
  ```
- **Response Format**: NDJSON stream with chunks containing:
  - `generated_response`: Text to display
  - `retrieved_sources`: Array of documents with metadata
  - `topic`: Conversation title
  - `message_id`, `retrieval_time`, `generation_time`, etc.
- **Streaming**: Uses Fetch API with ReadableStream for progressive rendering
- **Animation**: Character-by-character typing at 20ms/char (50 chars/second)

### Feedback API
- **Endpoint**: `POST /feedback`
- **Request Format**:
  ```json
  {
    "message_id": "string",
    "feedback_sign": "positive" | "negative" | "neutral",
    "feedback_text": "optional comment"
  }
  ```
- **Response**: 200 OK on success

### Document Metadata
- **NRC ADAMS**: Uses `AccessionNumber` from metadata
- **eDoc**: Uses `DocumentTitle` from metadata
- **Retrieved Sources**: Array with `source_id`, `text`, and `metadata` object

## Configuration

### Environment Variables (`src/environments/environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8001'
};
```

### User Configuration
User ID and AD group are retrieved from backend:
- Fetched from `/user` endpoint on initialization
- Used in all chat and feedback requests
- Determines document source access

### Available Models
- **Llama 3.1 8B**: Fast, efficient model (4096 tokens)
- **Llama 3.1 70B**: High-quality model (8192 tokens)

### Document Sources
- **NRC ADAMS**: External documents (public access)
- **eDoc**: Internal documents (requires authorization)

## Documentation

Detailed documentation available:
- **LLM-API-INTEGRATION.md**: NDJSON streaming implementation
- **INLINE-SOURCE-CITATIONS.md**: Citation parsing and display
- **SOURCE-CITATION-STYLING.md**: Badge design and interaction
- **FEEDBACK-API-INTEGRATION.md**: Feedback submission flow
- **WARP.md**: Development commands and architecture

## Future Enhancements

### Inline Citations
- **Click to Open**: Navigate to full document view
- **Hover Previews**: Show document excerpt and metadata
- **Document Icons**: Different icons for PDF, Word, etc.
- **Citation Numbering**: Academic-style superscript numbers

### General
- **WebSocket Support**: For even faster streaming
- **Document Upload**: Support for user document uploads
- **Conversation Export**: Download as PDF or markdown
- **Admin Panel**: Manage users, documents, and models
- **Analytics Dashboard**: Usage metrics and feedback analysis
- **Multi-language Support**: Internationalization (i18n)

## Technology Stack

### Frontend
- **Angular 20**: Standalone components, signals, and modern APIs
- **TypeScript 5.9**: Strict mode with advanced type safety
- **Angular Material**: UI component library
- **Signals**: Reactive state management (no RxJS for state)
- **Marked**: Markdown parsing and rendering
- **KaTeX**: LaTeX math rendering
- **DOMPurify**: HTML sanitization for security

### Patterns & Practices
- **Standalone Components**: No NgModules
- **OnPush Change Detection**: Performance optimization
- **Native Control Flow**: `@if`, `@for`, `@switch` (no structural directives)
- **inject() Function**: Dependency injection without constructors
- **Computed Signals**: Derived state with automatic dependency tracking
- **Fetch API**: Modern HTTP requests with streaming support

### Storage & Persistence
- **LocalStorage**: Conversations and user preferences
- **Backend API**: Messages, feedback, and analytics

## Contributing

1. Follow Angular best practices and coding standards
2. Use TypeScript strict mode
3. Implement proper error handling
4. Add unit tests for new features
5. Update documentation for API changes

## License

This project is licensed under the MIT License.