# AI Chat Assistant - Design Definitions

## Document Information
- **Version**: 1.0
- **Last Updated**: November 2025
- **Status**: Living Document

---

## 1. System Overview

### 1.1 Purpose
The AI Chat Assistant is a web-based conversational interface that enables users to interact with AI models to retrieve information from various document sources using Retrieval-Augmented Generation (RAG) technology.

### 1.2 System Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Angular 20 Application                    │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │ │
│  │  │   UI Layer   │  │   Services   │  │  Models  │ │ │
│  │  │ (Components) │◄─┤    Layer     │◄─┤  (Types) │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────┘ │ │
│  │         ▲                 ▲                         │ │
│  │         │                 │                         │ │
│  │         ▼                 ▼                         │ │
│  │  ┌──────────────┐  ┌──────────────┐               │ │
│  │  │   Signals    │  │ Local Storage │               │ │
│  │  │   (State)    │  │ (Persistence) │               │ │
│  │  └──────────────┘  └──────────────┘               │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ HTTP/REST API
                  ▼
┌─────────────────────────────────────────────────────────┐
│                    Backend Services                      │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │   AI/LLM   │  │   RAG      │  │   Document       │  │
│  │   Service  │  │   Engine   │  │   Repository     │  │
│  └────────────┘  └────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 1.3 Technology Stack

**Frontend Framework**
- Angular 20 with standalone components
- TypeScript 5.9 (strict mode)
- No NgModules architecture

**State Management**
- Angular Signals for reactive state
- Computed signals for derived state
- No RxJS for state management (used only for async operations)

**UI Components**
- Angular Material for UI components
- Custom components following OnPush change detection
- Native Angular control flow (`@if`, `@for`, `@switch`)

**Content Rendering**
- marked.js for Markdown parsing
- KaTeX for LaTeX/mathematical notation
- DOMPurify for HTML sanitization

**Data Persistence**
- Browser localStorage for conversation history
- No server-side persistence (currently)

---

## 2. Design Principles

### 2.1 Core Principles

**Simplicity First**
- Clean, intuitive interface
- Minimal learning curve
- Self-explanatory interactions

**Performance Optimized**
- OnPush change detection strategy
- Lazy loading where applicable
- Efficient signal-based reactivity

**Accessibility**
- Keyboard navigation support
- Screen reader friendly
- ARIA labels and semantic HTML

**Responsive Design**
- Mobile-first approach
- Adaptive layouts
- Touch-friendly interfaces

### 2.2 User Experience Goals

1. **Speed**: Fast response times and smooth interactions
2. **Clarity**: Clear visual hierarchy and information presentation
3. **Trust**: Transparent AI reasoning and cited sources
4. **Control**: User control over data sources and preferences
5. **Consistency**: Uniform design patterns throughout

---

## 3. Component Architecture

### 3.1 Component Hierarchy

```
App (Root)
├── AppToolbarComponent
├── RouterOutlet
    └── ChatLayoutComponent
        ├── ConversationSidebarComponent
        └── ChatInterfaceComponent
            ├── MessageComponent
            │   ├── MarkdownContentComponent
            │   ├── ThinkingSectionComponent
            │   ├── RAGDocumentLinkComponent
            │   └── FeedbackDialogComponent
            ├── FollowupQuestionsComponent
            ├── ThemeSelectorDialogComponent
            └── CitationPreviewModalComponent
```

### 3.2 Component Design Patterns

**All components follow these standards:**
- Standalone components (default in Angular 20)
- `ChangeDetectionStrategy.OnPush`
- `inject()` function for dependency injection
- `input()` and `output()` functions for component I/O
- Native control flow instead of structural directives

**Example Pattern:**
```typescript
@Component({
  selector: 'app-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MaterialModule],
  template: `...`
})
export class ExampleComponent {
  private service = inject(ExampleService);
  
  data = input.required<DataType>();
  action = output<ActionType>();
  
  protected computedValue = computed(() => {
    return this.data().someProperty;
  });
}
```

### 3.3 State Management Pattern

**Service-Owned State**
```typescript
export class StateService {
  // Private writable signals
  private _data = signal<Data[]>([]);
  
  // Public readonly signals
  readonly data = this._data.asReadonly();
  
  // Computed derived state
  readonly filteredData = computed(() => {
    return this._data().filter(/* logic */);
  });
  
  // State mutations
  updateData(newData: Data): void {
    this._data.update(current => [...current, newData]);
  }
}
```

**Component Consumption**
```typescript
export class ConsumerComponent {
  private stateService = inject(StateService);
  
  protected data = this.stateService.data;
  protected filtered = this.stateService.filteredData;
}
```

---

## 4. Service Layer Design

### 4.1 Core Services

**ChatService**
- Purpose: Manage conversations and messages
- Responsibilities:
  - Create/delete/select conversations
  - Send messages and receive responses
  - Persist conversations to localStorage
  - Handle message feedback
- State: conversations, currentConversationId, isLoading

**DocumentService**
- Purpose: Manage document sources and filters
- Responsibilities:
  - Load available document sources
  - Filter by user authorization (AD groups)
  - Apply metadata filters
  - Track selected sources
- State: documents, selectedSources, selectedFilters, userGroups

**ThemeService**
- Purpose: Manage UI theme preferences
- Responsibilities:
  - Switch between light/dark/system themes
  - Listen to system theme changes
  - Persist theme preference
  - Apply theme to DOM
- State: themeMode, systemPrefersDark, currentTheme

**MarkdownRendererService**
- Purpose: Render markdown and LaTeX content
- Responsibilities:
  - Parse markdown with marked.js
  - Render math with KaTeX
  - Sanitize HTML output
  - Handle code blocks and syntax highlighting
- State: Stateless (pure rendering)

**SidebarService**
- Purpose: Control sidebar visibility
- Responsibilities:
  - Toggle sidebar open/closed
  - Track sidebar state
- State: isOpen

### 4.2 Service Communication

Services communicate through:
1. **Shared State**: Services expose readonly signals
2. **Method Calls**: Components call service methods
3. **Events**: Services use signals for reactive updates

---

## 5. Data Models

### 5.1 Core Data Structures

**ChatMessage**
```typescript
interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  feedback?: MessageFeedback;
  ragDocuments?: RAGDocument[];
  apiMessageId?: string;
  thinkingText?: string;
  toolingText?: string;
  citationMetadata?: Record<string, DocumentCitationMetadata>;
  followupQuestions?: { topic: string; followups: string[] };
}
```

**Conversation**
```typescript
interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}
```

**RAGDocument**
```typescript
interface RAGDocument {
  id: string;
  title: string;
  content: string;
  source: DocumentSource;
  metadata: DocumentMetadata;
  pageNumber?: number;
  relevanceScore?: number;
}
```

**DocumentSource**
```typescript
interface DocumentSource {
  id: string;
  name: string;
  type: 'external' | 'internal';
  requiresAuth: boolean;
  allowedGroups?: string[];
}
```

### 5.2 API Request/Response Models

**LLMRequest** (used by LlmApiService)
```typescript
interface LLMRequest {
  user_query: string;
  username: string;
  session_id: string;
}
```

**LLMResponseChunk** (streaming response)
```typescript
interface LLMResponseChunk {
  thinkingText: string;
  toolingText: string;
  responseText: string;
  metadata?: Record<string, any>;
  followupQuestions?: { topic: string; followups: string[] };
  isComplete: boolean;
}
```

**FeedbackRequest**
```typescript
interface FeedbackRequest {
  message_id: string;
  feedback_sign: 'positive' | 'negative' | 'neutral';
  feedback_text: string;
}
```

---

## 6. UI/UX Design Specifications

### 6.1 Visual Design System

**Color Palette**

Light Theme:
- Primary: #1976d2 (Material Blue)
- Background: #ffffff
- Surface: #f5f5f5
- Text Primary: rgba(0, 0, 0, 0.87)
- Text Secondary: rgba(0, 0, 0, 0.60)

Dark Theme:
- Primary: #90caf9 (Material Blue Light)
- Background: #121212
- Surface: #1e1e1e
- Text Primary: rgba(255, 255, 255, 0.87)
- Text Secondary: rgba(255, 255, 255, 0.60)

**Typography**
- Font Family: System fonts (Roboto fallback)
- Headings: Bold, hierarchical sizing
- Body: Regular, 14-16px
- Code: Monospace (Consolas, Monaco, Courier New)

**Spacing Scale**
- Base unit: 8px
- Scale: 4px, 8px, 16px, 24px, 32px, 48px, 64px

**Border Radius**
- Small: 4px
- Medium: 8px
- Large: 12px

### 6.2 Layout Specifications

**Application Layout**
```
┌─────────────────────────────────────────────────────┐
│                Top Toolbar (64px)                    │
├──────────────┬──────────────────────────────────────┤
│              │                                       │
│   Sidebar    │        Main Content Area             │
│   (280px)    │                                       │
│   Collapsible│                                       │
│              │                                       │
└──────────────┴──────────────────────────────────────┘
```

**Responsive Breakpoints**
- Mobile: < 768px (sidebar overlays)
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Chat Message Layout**
```
┌──────────────────────────────────────────┐
│  [Avatar] Message Content                │
│           - Main text                    │
│           - Citations [1][2]             │
│           - Expandable sections          │
│           [👍] [👎]                      │
└──────────────────────────────────────────┘
```

### 6.3 Interactive Elements

**Buttons**
- Primary: Filled, elevated
- Secondary: Outlined
- Text: No background
- Icon: Minimal padding

**Form Controls**
- Input fields: Material Design style
- Textareas: Auto-expanding
- Selectors: Dropdown with search

**Dialogs**
- Modal with backdrop
- Centered on screen
- Maximum width: 90vw
- Escape key to close

### 6.4 Animation and Transitions

**Standard Durations**
- Fast: 100ms (hover effects)
- Normal: 200ms (state changes)
- Slow: 300ms (page transitions)

**Easing Functions**
- Standard: cubic-bezier(0.4, 0.0, 0.2, 1)
- Deceleration: cubic-bezier(0.0, 0.0, 0.2, 1)
- Acceleration: cubic-bezier(0.4, 0.0, 1, 1)

---

## 7. Security Design

### 7.1 Authentication & Authorization

**User Authentication**
- Handled by external authentication system
- User ID passed with each request
- AD group membership for authorization

**Document Access Control**
- Documents tagged with `type: 'internal' | 'external'`
- Internal documents require AD group membership
- Authorization checked client-side (validated server-side)

### 7.2 Data Security

**Content Sanitization**
- All rendered HTML passed through DOMPurify
- XSS prevention on user input
- Safe handling of markdown content

**Local Storage**
- Conversations stored in browser localStorage
- No sensitive data persisted
- Cleared on logout (if implemented)

**API Security**
- HTTPS for all communications (production)
- Authentication tokens in headers
- CORS configuration

---

## 8. Performance Design

### 8.1 Optimization Strategies

**Change Detection**
- OnPush strategy on all components
- Minimal template expressions
- Computed signals for derived state

**Bundle Size**
- Standalone components for tree-shaking
- Lazy loading of routes
- Dynamic imports for large libraries

**Rendering Performance**
- Virtual scrolling for long conversations
- Debounced input handlers
- Memoized computation with computed signals

### 8.2 Loading States

**Progressive Loading**
1. Show skeleton screens during load
2. Stream responses when possible
3. Lazy load conversation history

**Error States**
- Clear error messages
- Retry mechanisms
- Graceful degradation

---

## 9. Accessibility Design

### 9.1 WCAG Compliance

**Target Level**: WCAG 2.1 AA

**Key Requirements**
- Keyboard navigation for all features
- Screen reader support with ARIA labels
- Sufficient color contrast ratios
- Focus indicators on interactive elements
- Skip navigation links

### 9.2 Assistive Technology Support

**Screen Readers**
- Semantic HTML structure
- ARIA live regions for dynamic content
- Descriptive alt text for icons
- Role attributes on custom components

**Keyboard Navigation**
- Tab order follows visual order
- Arrow keys for list navigation
- Enter/Space for activation
- Escape for modal dismissal

---

## 10. Extensibility Design

### 10.1 Plugin Architecture

**Future Extension Points**
- Custom message renderers
- Additional document source types
- Alternative AI model backends
- Custom metadata filters

### 10.2 Configuration

**Environment Configuration**
- API endpoints
- Feature flags
- Model availability
- Document source definitions

**User Preferences**
- Theme selection
- Default document sources
- Notification settings

---

## 11. Testing Strategy

### 11.1 Testing Approach

**Unit Tests**
- Services: State management and business logic
- Components: Input/output behavior
- Utilities: Pure functions

**Integration Tests**
- Component + Service interactions
- API communication
- State persistence

**E2E Tests**
- Critical user flows
- Cross-browser compatibility
- Responsive design validation

### 11.2 Test Coverage Goals

- Services: 80%+ coverage
- Components: 70%+ coverage
- Critical paths: 100% coverage

---

## 12. Deployment Design

### 12.1 Build Configuration

**Development**
- Source maps enabled
- No optimization
- Hot module replacement

**Production**
- Minification and tree-shaking
- AOT compilation
- Cache busting with hashed filenames

### 12.2 Environment Variables

```typescript
environment.ts {
  production: boolean;
  apiUrl: string;
  authProvider: string;
  featureFlags: {
    multipleModels: boolean;
    advancedFilters: boolean;
    feedbackSystem: boolean;
  };
}
```

---

## 13. Future Considerations

### 13.1 Planned Features

1. **Real-time Streaming**: WebSocket support for streaming responses
2. **Collaboration**: Share conversations with other users
3. **Advanced Search**: Full-text search across conversations
4. **Export**: Download conversations as PDF/Markdown
5. **Voice Input**: Speech-to-text for message input

### 13.2 Technical Debt and Future Work

1. **DocumentService.loadDocuments()**: Implement actual API calls (currently uses mock data)
2. **DocumentService.searchDocuments()**: Implement document search API
3. **Authorization**: Implement AD group checking for internal documents
4. **User Profile**: Implement profile management functionality
5. **Sign Out**: Implement authentication/sign out functionality
6. **Server-side persistence**: Move conversation storage from localStorage to backend
7. **Error handling**: Add comprehensive error handling and retry logic
8. **Telemetry**: Add analytics and usage tracking

---

## Appendix A: Design Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Oct 2025 | Angular Signals over RxJS | Simpler mental model, better performance |
| Oct 2025 | localStorage for persistence | Simplicity for MVP, no backend needed |
| Oct 2025 | Standalone components | Modern Angular best practice, better tree-shaking |
| Oct 2025 | Material Design | Consistent UI, accessibility built-in |
| Oct 2025 | marked.js + KaTeX | Industry standard, well-maintained |

---

## Appendix B: Glossary

- **RAG**: Retrieval-Augmented Generation - AI technique combining retrieval and generation
- **Signal**: Angular's reactive primitive for state management
- **OnPush**: Change detection strategy that only checks when inputs change
- **Standalone Component**: Angular component that declares its own dependencies
- **AD Group**: Active Directory security group for authorization
- **LLM**: Large Language Model - AI model for text generation

---

*End of Design Definitions Document*
