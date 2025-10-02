# AI Chat Assistant

A modern, clean chat interface for interacting with on-premises LLM models. Built with Angular 20 and TypeScript, featuring RAG document integration, conversation history, and user feedback mechanisms.

## Features

### Core Chat Functionality
- **Clean Chat Interface**: Modern, intuitive chat UI with message bubbles and typing indicators
- **Model Selection**: Choose from available LLM models with detailed information
- **Real-time Messaging**: Send messages with Enter key or click, with character count
- **Loading States**: Visual feedback during message processing

### Conversation Management
- **Conversation History**: Persistent conversation storage in localStorage
- **Multiple Conversations**: Create, switch between, and delete conversations
- **Conversation Sidebar**: Easy navigation between chat sessions
- **Auto-save**: Conversations are automatically saved as you chat

### RAG Document Integration
- **Document Sources**: Support for external and internal document sources
- **Source Selection**: Choose which document sources to use for RAG
- **Metadata Filtering**: Filter documents by metadata fields (date, author, category, etc.)
- **Authorization**: Internal documents require AD group membership
- **Document Links**: Clickable links to RAG documents used in responses
- **Hover Previews**: Preview document content on hover with metadata

### User Feedback
- **Response Rating**: Thumbs up/down feedback for AI responses
- **Feedback Persistence**: Feedback is stored and sent to backend
- **Visual Confirmation**: Clear indication when feedback is submitted

### Responsive Design
- **Mobile Friendly**: Optimized for desktop and mobile devices
- **Modern UI**: Clean, professional interface with smooth animations
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Architecture

### Services
- **ChatService**: Manages conversations, messages, and API communication
- **DocumentService**: Handles document sources, filtering, and RAG integration

### Components
- **ChatInterfaceComponent**: Main chat interface with input and message display
- **MessageComponent**: Individual message display with feedback
- **ConversationSidebarComponent**: Conversation history and management
- **DocumentSelectorComponent**: Document source selection and filtering
- **ModelSelectorComponent**: LLM model selection
- **RAGDocumentLinkComponent**: Document links with hover previews

### Models
- **ChatMessage**: Message structure with content, role, timestamp, and metadata
- **Conversation**: Conversation container with messages and metadata
- **RAGDocument**: Document structure with content, source, and metadata
- **DocumentSource**: Source configuration with authorization rules
- **LLMModel**: Model information and capabilities

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

The application is designed to be flexible for API integration:

### Chat API
- **Endpoint**: To be configured
- **Request Format**: `ChatRequest` with message, model, and document filters
- **Response Format**: `ChatResponse` with message and RAG documents

### Document API
- **Document Loading**: Fetch available documents and sources
- **Search**: Search documents by query and filters
- **Authorization**: Verify user permissions for internal documents

### Feedback API
- **Endpoint**: To be configured
- **Format**: Message ID, feedback type, and optional comment

## Configuration

### Document Sources
Configure document sources in `DocumentService`:
- External sources: Publicly accessible documents
- Internal sources: Require AD group authorization

### Models
Configure available models in `ChatService`:
- Model ID, name, description
- Token limits and availability
- Model-specific settings

### Authorization
Implement AD group checking in the backend:
- User authentication and group membership
- Document access permissions
- Source-level authorization

## Future Enhancements

- **Real-time Updates**: WebSocket integration for live responses
- **File Upload**: Support for document uploads
- **Advanced Search**: Full-text search with highlighting
- **Export Features**: Export conversations and documents
- **Admin Panel**: Manage users, documents, and models
- **Analytics**: Usage tracking and performance metrics

## Technology Stack

- **Angular 20**: Modern Angular with standalone components
- **TypeScript**: Strict type checking and modern features
- **Signals**: Reactive state management
- **CSS Grid/Flexbox**: Modern layout techniques
- **Local Storage**: Client-side persistence
- **RxJS**: Reactive programming patterns

## Contributing

1. Follow Angular best practices and coding standards
2. Use TypeScript strict mode
3. Implement proper error handling
4. Add unit tests for new features
5. Update documentation for API changes

## License

This project is licensed under the MIT License.