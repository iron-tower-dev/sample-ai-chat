# Components Overview

This document provides a high-level overview of all components in the Angular chat application. Components handle UI rendering and user interactions.

## Table of Contents
- [ChatInterfaceComponent](#chatinterfacecomponent)
- [MessageComponent](#messagecomponent)
- [ConversationSidebarComponent](#conversationsidebarcomponent)
- [ChatLayoutComponent](#chatlayoutcomponent)
- [AppToolbarComponent](#apptoolbarcomponent)
- [MarkdownContentComponent](#markdowncontentcomponent)
- [RAGDocumentLinkComponent](#ragdocumentlinkcomponent)
- [ThinkingSectionComponent](#thinkingsectioncomponent)
- [FollowupQuestionsComponent](#followupquestionscomponent)
- [FeedbackDialogComponent](#feedbackdialogcomponent)
- [CitationPreviewModalComponent](#citationpreviewmodalcomponent)
- [ThemeSelectorDialogComponent](#themeselectordialogcomponent)

---

## ChatInterfaceComponent

**Location**: `src/app/components/chat-interface/chat-interface.component.ts`

**Purpose**: Main chat interface containing the message list and input area.

### Key Responsibilities
- Display conversation messages
- Handle user message input
- Auto-scroll to new messages
- Show loading states
- Display followup questions
- Manage scroll-to-bottom behavior

### Inputs
None - consumes data directly from ChatService

### Outputs
None - communicates through ChatService

### Key Features

#### Message Input
- Textarea with 8000 character limit
- Character counter display
- Enter key to send (Shift+Enter for new line)
- Disabled during loading
- Auto-resize based on content

#### Auto-Scroll Behavior
- Automatically scrolls to bottom when new messages arrive
- Disables auto-scroll when user manually scrolls up
- Shows "scroll to bottom" FAB button when not at bottom
- Periodic scrolling during streaming responses (every 100ms)
- Scroll detection via `onMessagesScroll()` event

#### Welcome Message
Displays when no messages exist:
- Chat icon
- Welcome heading
- Instructions to start conversation

#### Followup Questions
- Displayed above message input
- Extracted from last assistant message
- Click to populate input field

### Template Structure
```
chat-interface
├── messages-container
│   ├── welcome-message (if empty)
│   ├── message components (loop)
│   └── scroll-to-bottom-btn (FAB)
└── input-area
    ├── followup-questions
    └── input-container
        ├── textarea
        └── input-actions
            ├── char-count
            └── send-button
```

### State Management
```typescript
currentMessage = signal('');         // Input field content
autoScrollEnabled = signal(true);    // Auto-scroll toggle
```

### Computed Signals
```typescript
currentMessages    // From ChatService
isLoading          // From ChatService
followupQuestions  // Last assistant message's followup questions
```

### Key Methods

#### `sendMessage(): Promise<void>`
Sends the current message to ChatService.
- Trims whitespace
- Clears input field
- Focuses back on textarea
- Enables auto-scroll

#### `onEnterKey(event: KeyboardEvent): void`
Handles Enter key press:
- Enter alone: Send message
- Shift+Enter: New line (default behavior)

#### `scrollToBottom(): void`
Scrolls message container to bottom.

#### `scrollToBottomManual(): void`
Manual scroll triggered by FAB button.
- Scrolls to bottom
- Re-enables auto-scroll

#### `onMessagesScroll(event): void`
Detects manual scrolling.
- Disables auto-scroll if user scrolls up
- Enables auto-scroll if at bottom

#### `onFollowupQuestionSelected(question: string): void`
Handles followup question click.
- Populates input field
- Focuses textarea
- User can edit before sending

### Effects

**Message Change Effect**:
Auto-scrolls when messages change and auto-scroll is enabled.

**Loading Effect**:
- Starts periodic scrolling during loading
- Stops when loading completes
- Final scroll after streaming ends

**Conversation Change Effect**:
- Scrolls to bottom when conversation switches
- Re-enables auto-scroll

### Styling
- Flexbox layout filling available space
- Sticky input area at bottom
- Scrollable message container
- Floating action button for scroll-to-bottom

---

## MessageComponent

**Location**: `src/app/components/message/message.component.ts`

**Purpose**: Renders individual chat messages with role-based styling, feedback controls, and content rendering.

### Key Responsibilities
- Display user and assistant messages
- Render markdown/LaTeX content
- Show thinking and tooling sections
- Handle feedback submission
- Display loading states
- Show citations inline

### Inputs
```typescript
message = input.required<ChatMessage>();  // Message to display
isLoading = input<boolean>(false);        // Loading state
pendingFeedback = input<'positive' | 'negative' | null>(null);  // Pending feedback type
```

### Outputs
```typescript
feedbackSubmitted = output<{
  messageId: string;
  type: 'positive' | 'negative';
  comment?: string;
}>();
```

### Template Structure
```
message [class based on role]
├── message-header
│   ├── message-role (icon + label)
│   └── message-meta (timestamp)
├── message-content
│   ├── tooling-indicator (if loading + tooling)
│   ├── thinking-indicator (if loading + no content)
│   ├── thinking-section (collapsible)
│   └── response-content (markdown)
├── message-actions (feedback buttons)
└── feedback-submitted (if feedback exists)
```

### Role-Based Display

#### User Messages
- User icon (person outline)
- "You" label
- Plain text content (no markdown)
- No feedback controls
- Right-aligned styling

#### Assistant Messages
- AI icon (robot/square)
- "AI Assistant" label
- Markdown/LaTeX rendered content
- Thinking/tooling sections
- Feedback controls
- Citations with hover previews
- Left-aligned styling

### Loading States

#### Tooling Indicator
Shown when:
- Message is loading
- Tooling text is present

Displays:
- Small spinner (16px)
- Tooling text (e.g., "Searching documentation")

#### Thinking Indicator
Shown when:
- Message is loading
- No content yet
- No tooling text

Displays:
- Spinner (20px)
- "Generating response..."

### Content Processing

#### Effect for Content Updates
Watches message changes and processes content:
- Filters out standalone "Thinking" text
- Updates processed content signal
- Handles empty content gracefully

#### Markdown Rendering
Delegates to `MarkdownContentComponent`:
- Full markdown support
- LaTeX math rendering
- Inline citations with hover
- Code syntax highlighting

### Feedback System

#### Feedback Buttons
Shown when:
- Message is from assistant
- No existing feedback

Actions:
- Thumbs up (positive)
- Thumbs down (negative)
- Opens feedback dialog on click

#### Feedback Display
Shown when feedback exists:
- Icon (thumbs up/down)
- Thank you message
- User's comment (if provided)
- Color-coded (positive/negative)

### Key Methods

#### `formatTimestamp(timestamp: Date): string`
Formats message timestamp in relative format:
- "Just now" (< 1 min)
- "Xm ago" (< 1 hour)
- "Xh ago" (< 24 hours)
- "Xd ago" (< 7 days)
- Full date (≥ 7 days)

#### `submitFeedback(type: 'positive' | 'negative'): void`
Opens feedback dialog:
- Creates dialog data with message ID and type
- Opens Material Dialog
- Emits feedback on close

### Integration Points
- **ChatService**: Via parent component for feedback
- **MarkdownContentComponent**: Content rendering
- **ThinkingSectionComponent**: Thinking/tooling display
- **FeedbackDialogComponent**: Feedback collection
- **Material Dialog**: Modal system

### Styling Classes
- `.message` - Base message container
- `.user-message` - User role styling
- `.assistant-message` - Assistant role styling
- `.message-header` - Header with role and timestamp
- `.message-content` - Main content area
- `.message-actions` - Feedback buttons
- `.feedback-submitted` - Feedback display
- `.tooling-indicator` - Loading with tooling
- `.thinking-indicator` - Loading without content

---

## ConversationSidebarComponent

**Location**: `src/app/components/conversation-sidebar/conversation-sidebar.component.ts`

**Purpose**: Sidebar displaying list of conversations with create, select, and delete actions.

### Key Responsibilities
- List all conversations
- Create new conversations
- Select/switch conversations
- Delete conversations
- Show active conversation
- Display conversation metadata

### Inputs
None - consumes data from ChatService

### Outputs
None - communicates through ChatService

### Key Features

#### Conversation List
- Shows all conversations in reverse chronological order
- Highlights active conversation
- Displays conversation title
- Shows last update time
- Empty state when no conversations

#### New Conversation Button
- Fixed at top of sidebar
- Creates conversation on click
- Automatically selects new conversation

#### Conversation Actions
- Click to select/switch
- Delete button (trash icon)
- Confirmation before delete (optional)

### Template Structure
```
conversation-sidebar
├── new-conversation-button
└── conversation-list
    └── conversation-item (loop)
        ├── conversation-title
        ├── conversation-meta
        └── delete-button
```

### Key Methods

#### `createNewConversation(): void`
Creates and selects a new conversation via ChatService.

#### `selectConversation(id: string): void`
Switches to selected conversation.

#### `deleteConversation(id: string, event: Event): void`
Deletes conversation:
- Stops event propagation (prevents selection)
- Calls ChatService to delete
- Handles current conversation deletion

### Styling
- Fixed width on desktop
- Full width on mobile
- Scrollable list
- Hover states for interactions
- Active conversation highlight

---

## ChatLayoutComponent

**Location**: `src/app/components/chat-layout/chat-layout.component.ts`

**Purpose**: Layout container providing the overall structure with sidebar and main content area.

### Key Responsibilities
- Manage responsive layout
- Control sidebar visibility
- Provide navigation structure
- Handle mobile/desktop layouts

### Structure
```
chat-layout
├── app-toolbar
└── mat-sidenav-container
    ├── mat-sidenav (sidebar)
    │   └── conversation-sidebar
    └── mat-sidenav-content (main)
        └── chat-interface
```

### Responsive Behavior
- **Desktop**: Sidebar always visible, side-by-side layout
- **Mobile**: Sidebar as drawer, overlay on main content
- Breakpoint typically at 768px or 960px

### Integration with SidebarService
Coordinates sidebar state:
- Open/close sidebar
- Persist sidebar state
- Handle responsive breakpoints

---

## AppToolbarComponent

**Location**: `src/app/components/app-toolbar/app-toolbar.component.ts`

**Purpose**: Top navigation bar with app title, navigation controls, and user actions.

### Key Responsibilities
- Display app title/logo
- Sidebar toggle button (mobile)
- Theme selector button
- User profile menu
- Navigation items

### Template Structure
```
mat-toolbar
├── menu-button (sidebar toggle)
├── app-title
├── spacer
├── theme-button
└── user-menu
    ├── profile-button
    └── sign-out-button
```

### Key Features

#### Sidebar Toggle
- Hamburger menu icon
- Only visible on mobile
- Toggles sidebar via SidebarService

#### Theme Control
- Sun/moon icon button
- Opens theme selector dialog
- Shows current theme

#### User Menu
- User icon/avatar
- Dropdown with:
  - User profile
  - Settings
  - Sign out (TODO)

---

## MarkdownContentComponent

**Location**: `src/app/components/markdown-content/markdown-content.component.ts`

**Purpose**: Renders markdown content with citation support and syntax highlighting.

### Key Responsibilities
- Render markdown to HTML
- Display LaTeX math expressions
- Process and display inline citations
- Provide citation hover previews
- Handle citation clicks

### Inputs
```typescript
content = input.required<string>();                      // Markdown content
ragDocuments = input<RAGDocument[]>([]);                 // Legacy RAG docs
citationMetadata = input<Record<string, any>>();         // Citation metadata
```

### Key Features

#### Markdown Rendering
Delegates to MarkdownRendererService:
- Full markdown syntax
- Code blocks with syntax highlighting
- LaTeX math (inline and display)
- Tables, lists, links
- Sanitized HTML output

#### Citation Processing
Extracts and links citations:
- Inline format: `[{UUID}]`
- Converts to clickable links
- Adds hover preview
- Links to citation metadata

#### Citation Interaction
- Hover: Shows document preview tooltip
- Click: Opens full citation modal
- Displays:
  - Document title
  - Relevant text chunk
  - Page number
  - Relevance score

### Template Structure
```
markdown-content
└── [innerHTML with processed content]
    └── citation-links (injected)
        └── rag-document-link components
```

### Key Methods

#### `renderContent(): Promise<void>`
Main rendering pipeline:
1. Takes markdown content
2. Calls MarkdownRendererService
3. Processes citations if metadata present
4. Updates rendered HTML signal
5. Attaches citation event handlers

#### Effect
Watches input changes and triggers re-render.

### Citation Format
Citations in metadata:
```typescript
{
  "{UUID}": {
    source_id: string,
    chunks: [
      {
        text: string,
        page_numbers: number[],
        bounding_boxes: string,
        distance: number
      }
    ]
  }
}
```

---

## RAGDocumentLinkComponent

**Location**: `src/app/components/rag-document-link/rag-document-link.component.ts`

**Purpose**: Renders individual citation links with hover preview and click handling.

### Key Responsibilities
- Display citation link
- Show hover preview tooltip
- Handle click to open full citation
- Display document metadata

### Inputs
```typescript
document = input.required<RAGDocument>();         // Document info
citationNumber = input<number>();                 // Display number
chunkMetadata = input<ChunkMetadata>();          // Specific chunk info
```

### Template Structure
```
a.citation-link
├── [citation-number]
└── mat-tooltip (hover preview)
```

### Hover Preview
Shows on hover:
- Document title
- Author (if available)
- Page number
- Excerpt of relevant text
- Relevance score

### Click Action
Opens CitationPreviewModalComponent with:
- Full document details
- All relevant chunks
- Page navigation
- PDF viewer (if available)

---

## ThinkingSectionComponent

**Location**: `src/app/components/thinking-section/thinking-section.component.ts`

**Purpose**: Collapsible section displaying LLM's thinking and tooling process.

### Key Responsibilities
- Display thinking text (internal reasoning)
- Display tooling text (actions taken)
- Provide collapsible UI
- Default to collapsed state

### Inputs
```typescript
thinkingText = input<string>('');
toolingText = input<string>('');
```

### Template Structure
```
mat-expansion-panel [collapsed by default]
├── mat-expansion-panel-header
│   ├── brain-icon
│   └── "View thinking process"
└── panel-content
    ├── thinking-section (if text)
    │   ├── "Thinking"
    │   └── thinking text
    └── tooling-section (if text)
        ├── "Actions"
        └── tooling text
```

### Styling
- Subtle background color
- Monospace font for technical content
- Icon in header
- Smooth expand/collapse animation

---

## FollowupQuestionsComponent

**Location**: `src/app/components/followup-questions/followup-questions.component.ts`

**Purpose**: Displays suggested followup questions for the current conversation.

### Key Responsibilities
- Display list of followup questions
- Handle question selection
- Show/hide based on availability
- Emit selected question to parent

### Inputs
```typescript
questions = input<{ topic: string; followups: string[] }>();
```

### Outputs
```typescript
questionSelected = output<string>();
```

### Template Structure
```
followup-questions [if questions exist]
├── topic-label
└── questions-list
    └── question-chip (loop)
```

### Key Features

#### Question Display
- Chips/buttons for each question
- Hover effects
- Click to select

#### Topic Display
Optional topic label above questions:
- "Related to: [topic]"
- Helps contextualize suggestions

### Styling
- Horizontal scrollable layout
- Chip-style buttons
- Primary color accent
- Smooth hover transitions

---

## FeedbackDialogComponent

**Location**: `src/app/components/feedback-dialog/feedback-dialog.component.ts`

**Purpose**: Modal dialog for collecting detailed feedback on assistant messages.

### Key Responsibilities
- Display feedback type (positive/negative)
- Collect optional comment
- Submit or cancel
- Validate input

### Dialog Data
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

### Template Structure
```
mat-dialog-container
├── dialog-title
│   ├── icon (thumbs up/down)
│   └── title text
├── dialog-content
│   ├── description
│   └── textarea (optional comment)
└── dialog-actions
    ├── cancel-button
    └── submit-button
```

### Feedback Types

#### Positive Feedback
- Thumbs up icon
- "Thanks for the positive feedback!"
- Optional: "Tell us what you liked"

#### Negative Feedback
- Thumbs down icon
- "Help us improve"
- Optional: "Tell us what went wrong"

### Key Methods

#### `onSubmit(): void`
Submits feedback:
- Validates comment (if provided)
- Closes dialog with result
- Returns to parent component

#### `onCancel(): void`
Cancels feedback submission:
- Closes dialog without result

### Validation
- Comment is optional
- Max length: 1000 characters
- Whitespace trimming

---

## CitationPreviewModalComponent

**Location**: `src/app/components/citation-preview-modal/citation-preview-modal.component.ts`

**Purpose**: Full-screen modal for viewing document citations with PDF preview.

### Key Responsibilities
- Display full document details
- Show relevant text chunks
- Navigate between chunks
- Display PDF with highlighted regions
- Show bounding boxes
- Provide download option

### Dialog Data
```typescript
{
  document: RAGDocument,
  chunks: ChunkMetadata[],
  initialChunkIndex: number
}
```

### Template Structure
```
dialog-container
├── dialog-header
│   ├── document-title
│   └── close-button
├── dialog-content
│   ├── pdf-viewer-panel
│   │   ├── pdf-canvas
│   │   └── bounding-box-overlays
│   └── chunks-panel
│       ├── chunk-navigation
│       └── chunk-list
│           └── chunk-card (loop)
│               ├── text
│               ├── page-numbers
│               └── relevance-score
└── dialog-actions
    └── download-button
```

### Key Features

#### PDF Viewer
- Renders PDF pages
- Highlights bounding boxes
- Zooms to relevant regions
- Page navigation

#### Chunk Navigation
- List of all relevant chunks
- Click to navigate to chunk's page
- Shows relevance scores
- Highlights current chunk

#### Document Metadata
- Title
- Author
- Source
- Date
- Accession number (if applicable)

### Key Methods

#### `navigateToChunk(index: number): void`
Switches to a specific chunk:
- Updates PDF page
- Highlights bounding box
- Scrolls chunk into view

#### `downloadDocument(): void`
Initiates document download (if available).

---

## ThemeSelectorDialogComponent

**Location**: `src/app/components/theme-selector-dialog/theme-selector-dialog.component.ts`

**Purpose**: Modal dialog for selecting application themes.

### Key Responsibilities
- Display available themes
- Show current theme
- Apply theme selection
- Preview themes

### Template Structure
```
dialog-container
├── dialog-title
│   └── "Select Theme"
├── dialog-content
│   └── theme-grid
│       └── theme-card (loop)
│           ├── theme-preview
│           ├── theme-name
│           └── checkmark (if selected)
└── dialog-actions
    └── close-button
```

### Theme Display
Each theme shows:
- Color preview (primary/accent)
- Theme name
- Light/dark indicator
- Selected checkmark

### Key Features

#### Theme Grid
- Responsive grid layout
- Visual color previews
- Hover effects
- Selected state

#### Instant Apply
- Clicking theme applies immediately
- No "save" button needed
- Changes persisted automatically

---

## Component Architecture Patterns

### All Components Follow These Patterns

#### 1. Standalone Components
```typescript
@Component({
  selector: 'app-component-name',
  imports: [CommonModule, /* other imports */],
  // No standalone: true needed (default in Angular 19+)
})
```

#### 2. OnPush Change Detection
```typescript
changeDetection: ChangeDetectionStrategy.OnPush
```

#### 3. Inject Function for Dependencies
```typescript
private service = inject(ServiceName);
```

#### 4. Input/Output Signals
```typescript
// Inputs
requiredInput = input.required<Type>();
optionalInput = input<Type>(defaultValue);

// Outputs
action = output<Type>();
```

#### 5. Native Control Flow
```typescript
@if (condition) {
  <!-- content -->
}

@for (item of items; track item.id) {
  <!-- item -->
}

@switch (value) {
  @case ('a') { <!-- case a --> }
  @default { <!-- default --> }
}
```

### Component Communication

#### Parent to Child
- Input signals
- Direct property binding

#### Child to Parent
- Output signals
- Event emission

#### Sibling Components
- Shared service (ChatService, ThemeService)
- Signal-based state

### Styling Approach

#### Component Styles
- Scoped CSS files
- CSS custom properties from theme
- BEM-like naming conventions

#### Material Components
- Material Design components
- Customized with theme colors
- Consistent spacing and typography

### Accessibility

#### Keyboard Navigation
- Tab order
- Enter/Space for actions
- Escape to close dialogs

#### ARIA Attributes
- Labels for icons
- Roles for custom controls
- Live regions for dynamic content

#### Screen Readers
- Descriptive labels
- Status announcements
- Semantic HTML

## Component Testing

### Unit Testing Pattern
```typescript
describe('ComponentName', () => {
  let component: ComponentName;
  let fixture: ComponentFixture<ComponentName>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentName]
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentName);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

### Mock Services
```typescript
const mockChatService = {
  currentMessages$: signal([]),
  sendMessage: jasmine.createSpy('sendMessage')
};

TestBed.configureTestingModule({
  imports: [ComponentName],
  providers: [
    { provide: ChatService, useValue: mockChatService }
  ]
});
```

## Performance Considerations

### OnPush Strategy
All components use OnPush change detection:
- Only check when inputs change
- When events fire
- When observables/signals emit

### Signal Benefits
- Automatic change detection
- No manual subscription management
- Fine-grained reactivity

### Virtual Scrolling
Consider for large message lists:
- Use `cdk-virtual-scroll-viewport`
- Renders only visible items
- Improves performance with 100+ messages

### Lazy Loading
Components can be lazy loaded via routing:
```typescript
{
  path: 'chat',
  loadComponent: () => import('./chat-layout/chat-layout.component')
    .then(m => m.ChatLayoutComponent)
}
```
