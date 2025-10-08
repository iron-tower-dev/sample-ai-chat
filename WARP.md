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
- **State**: `conversations`, `currentConversationId`, `availableModels`, `documentSources`, `isLoading`
- **Computed Signals**: `currentConversation`, `currentMessages`, `hasConversations`
- Manages conversation lifecycle (create, select, delete)
- Handles message sending with simulated API responses (TODO: replace with actual API)
- Persists conversations to localStorage
- Feedback submission (TODO: implement backend API call)

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
- `DocumentSelectorComponent`: Select document sources and apply metadata filters
- `ModelSelectorComponent`: Choose LLM model
- `RAGDocumentLinkComponent`: Document links with hover previews
- `MarkdownContentComponent`: Renders markdown/LaTeX content
- `ThemeToggleComponent`: Toggle light/dark/system theme

### Data Models (`src/app/models/chat.models.ts`)

Core interfaces:
- `ChatMessage`: Message with content, role, timestamp, optional feedback and RAG documents
- `Conversation`: Container for messages with metadata
- `RAGDocument`: Document with source, metadata, and relevance score
- `DocumentSource`: Source config with auth requirements and allowed groups
- `LLMModel`: Model info with availability and token limits
- `ChatRequest`/`ChatResponse`: API request/response structures
- `DocumentFilter`: Metadata-based document filtering

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

### TODO Items / Backend Integration

Several areas are stubbed for backend integration:
1. **ChatService.sendMessage()**: Replace `simulateAPIResponse()` with actual API call
2. **ChatService.submitFeedback()**: Implement feedback API endpoint
3. **DocumentService.loadDocuments()**: Load documents from backend
4. **DocumentService.searchDocuments()**: Implement document search API
5. **Authorization**: Implement AD group checking for internal documents
6. **Real-time Updates**: Consider WebSocket integration for streaming responses

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
