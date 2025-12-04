# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Running the Application
```bash
npm start                          # Start dev server on http://localhost:4200
npm run watch                      # Build in watch mode (development config)
```

### Building
```bash
npm run build                      # Production build with optimization
ng build -- --configuration development  # Development build
```

### Testing
```bash
npm test                           # Run unit tests with Karma/Jasmine
ng test -- --include='**/component-name.spec.ts'  # Run specific test file
```

### Angular CLI
```bash
npm run ng -- <command>            # Run Angular CLI commands through npm
ng generate component <name>       # Generate new component
ng generate service <name>         # Generate new service
```

## Code Architecture

### Technology Stack
- **Angular 20** with standalone components (no NgModules)
- **Signals** for reactive state management (not RxJS Observables for state)
- **TypeScript 5.9** with strict mode
- **marked** for Markdown rendering
- **KaTeX** for LaTeX math rendering
- **DOMPurify** for HTML sanitization

### Core Services

#### ChatService (`src/app/services/chat.service.ts`)
Central service for chat functionality using signals:
- **State**: `conversations`, `currentConversationId`, `documentSources`, `isLoading`
- **Computed Signals**: `currentConversation`, `currentMessages`, `hasConversations`
- Manages conversation lifecycle (create, select, delete)
- Handles message sending via LlmApiService with streaming SSE responses
- Persists conversations to localStorage
- Feedback submission integrated with backend API

#### DocumentService (`src/app/services/document.service.ts`)
Manages RAG (Retrieval-Augmented Generation) document integration:
- **State**: `documents`, `selectedSources`, `selectedFilters`, `userGroups`
- **Computed Signals**: `availableSources` (filtered by user permissions), `filteredDocuments`, `availableMetadataFields`
- Authorization based on AD group membership
- Document source selection and metadata filtering
- Methods for document search and filtering (TODO: implement API calls)

#### MarkdownRendererService (`src/app/services/markdown-renderer.service.ts`)
Handles markdown and LaTeX rendering:
- Uses `marked` for markdown, `KaTeX` for math, `DOMPurify` for sanitization
- Processes inline math (`$...$`) and display math (code blocks with `latex` or `math` language)
- Custom HTML adjustments for KaTeX positioning issues
- Protects code blocks during inline math processing

#### ThemeService (`src/app/services/theme.service.ts`)
Manages application theming:
- **State**: `themeMode` ('light' | 'dark' | 'system'), `systemPrefersDark`
- **Computed Signal**: `currentTheme` resolves 'system' to actual theme
- Persists theme preference to localStorage
- Listens to system color scheme changes
- Applies theme via CSS classes and data attributes

### Component Structure

All components use:
- **Standalone components** (default, do NOT set `standalone: true` explicitly)
- **`ChangeDetectionStrategy.OnPush`** for performance
- **`input()` and `output()` functions** instead of decorators
- **Native control flow** (`@if`, `@for`, `@switch`) not `*ngIf`, `*ngFor`, `*ngSwitch`
- **`inject()` function** for dependency injection instead of constructor injection

Key components:
- `ChatInterfaceComponent`: Main chat UI with message input and display
- `MessageComponent`: Individual message with feedback controls (thumbs up/down)
- `ConversationSidebarComponent`: List and manage conversations
- `ChatLayoutComponent`: Layout container with sidenav for chat interface
- `AppToolbarComponent`: Application toolbar with navigation and theme controls
- `RAGDocumentLinkComponent`: Document links with hover previews
- `MarkdownContentComponent`: Renders markdown/LaTeX content
- `ThemeSelectorDialogComponent`: Theme selection dialog
- `CitationPreviewModalComponent`: Modal for viewing document citations
- `FeedbackDialogComponent`: Dialog for submitting message feedback
- `FollowupQuestionsComponent`: Displays suggested followup questions
- `ThinkingSectionComponent`: Shows LLM thinking and tooling process

### Data Models (`src/app/models/chat.models.ts`)

Core interfaces:
- `ChatMessage`: Message with content, role, timestamp, optional feedback, RAG documents, citation metadata, thinking/tooling text, and followup questions
- `MessageFeedback`: Feedback info with type (positive/negative) and optional comment
- `Conversation`: Container for messages with metadata
- `RAGDocument`: Document with source, metadata, and relevance score
- `DocumentSource`: Source config with auth requirements and allowed groups
- `DocumentMetadata`: Document metadata with flexible fields
- `DocumentCitationMetadata`: Metadata for document citations including chunks and bounding boxes
- `ChunkMetadata`: Chunk info with pages, bounding boxes, and relevance scores

### State Management Pattern

This application uses **Angular Signals** exclusively for state management:
- Use `signal()` for writable state
- Use `computed()` for derived state
- Use `.asReadonly()` to expose signals publicly
- Use `.update()` or `.set()` to modify state (NOT `mutate`)
- Services own state, components consume via computed signals

### Styling

- Global styles in `src/styles.css`
- Component-scoped CSS files
- CSS custom properties for theming (via `data-theme` attribute)
- Theme classes: `.light-theme` and `.dark-theme`
- Prettier configuration: 100 char width, single quotes, Angular HTML parser

### LLM API Integration

The application integrates with an LLM backend via:
- **LlmApiService**: Handles SSE streaming responses from LLM API
- **Streaming Support**: Real-time streaming of thinking, tooling, and response text
- **Citation Metadata**: Automatic extraction and linking of source documents
- **Followup Questions**: Dynamic generation of suggested followup questions
- **Feedback API**: Integrated feedback submission with message IDs

### TODO Items / Future Enhancements

1. **DocumentService.loadDocuments()**: Load documents from backend (currently uses mock data)
2. **DocumentService.searchDocuments()**: Implement document search API
3. **Authorization**: Implement AD group checking for internal documents
4. **User Profile**: Implement profile management functionality
5. **Sign Out**: Implement authentication/sign out functionality

## Angular Coding Standards

Per `.github/copilot-instructions.md`:

### Components
- Keep components focused on single responsibility
- Use `input()` and `output()` functions
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush`
- Use inline templates for small components
- Prefer Reactive forms over Template-driven
- Use `class` bindings instead of `ngClass`
- Use `style` bindings instead of `ngStyle`

### Services
- Single responsibility design
- Use `providedIn: 'root'` for singletons
- Use `inject()` function instead of constructor injection

### TypeScript
- Strict type checking enabled
- Avoid `any` type; use `unknown` when uncertain
- Prefer type inference when obvious

### Templates
- Keep templates simple, avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`)
- Use async pipe for observables (though this project uses signals primarily)

### Signals
- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Use `update` or `set` instead of `mutate`

## File Naming Conventions

Follow Angular style guide:
- Component: `component-name.component.ts` with matching `.html` and `.css` files
- Service: `service-name.service.ts`
- Models: `model-name.models.ts`
- Use kebab-case for file names
- Use descriptive, feature-based names
