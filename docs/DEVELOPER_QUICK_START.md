# Developer Quick Start Guide

Welcome to the AI Chat Assistant project! This guide will help you get up and running quickly as a new developer on the team.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Project Setup](#project-setup)
- [Project Structure](#project-structure)
- [Key Concepts](#key-concepts)
- [Development Workflow](#development-workflow)
- [Common Tasks](#common-tasks)
- [Architecture Overview](#architecture-overview)
- [Best Practices](#best-practices)
- [Resources](#resources)

---

## Prerequisites

### Required Tools
- **Node.js**: ≥ 18.x (LTS recommended)
- **npm**: ≥ 9.x (comes with Node.js)
- **Git**: Any recent version
- **IDE**: VS Code recommended with Angular Language Service extension

### Recommended Extensions (VS Code)
- Angular Language Service
- ESLint
- Prettier
- TypeScript + JavaScript
- Material Icon Theme

### Knowledge Prerequisites
- TypeScript fundamentals
- Angular basics (components, services, dependency injection)
- RxJS or Signals (this project uses Signals)
- HTML/CSS
- REST APIs and HTTP

---

## Project Setup

### 1. Clone the Repository
```bash
git clone [repository-url]
cd sample-ai-chat
```

### 2. Install Dependencies
```bash
npm install
```

This will install:
- Angular 20
- Angular Material
- TypeScript 5.9
- marked (markdown rendering)
- KaTeX (LaTeX math)
- DOMPurify (HTML sanitization)
- All other dependencies

### 3. Start Development Server
```bash
npm start
```

The app will be available at `http://localhost:4200`

### 4. Verify Setup
- Open browser to `http://localhost:4200`
- You should see the chat interface
- Create a new conversation
- Send a test message

If everything works, you're ready to develop!

---

## Project Structure

```
sample-ai-chat/
├── src/
│   ├── app/
│   │   ├── components/        # UI components
│   │   │   ├── chat-interface/
│   │   │   ├── message/
│   │   │   ├── conversation-sidebar/
│   │   │   └── ...
│   │   ├── services/          # Business logic and state
│   │   │   ├── chat.service.ts
│   │   │   ├── document.service.ts
│   │   │   ├── llm-api.service.ts
│   │   │   └── ...
│   │   ├── models/            # TypeScript interfaces
│   │   │   ├── chat.models.ts
│   │   │   └── theme.models.ts
│   │   └── app.component.ts   # Root component
│   ├── assets/                # Static files
│   ├── environments/          # Environment configs
│   └── styles.css             # Global styles
├── docs/                      # Documentation
│   ├── SERVICES_OVERVIEW.md
│   ├── COMPONENTS_OVERVIEW.md
│   └── ...
├── angular.json               # Angular CLI config
├── tsconfig.json              # TypeScript config
└── package.json               # Dependencies
```

### Key Directories

#### `/src/app/components`
All UI components using Angular standalone component pattern.

**Organization**:
- Each component in its own folder
- Folder contains: `.ts`, `.html`, `.css`, `.spec.ts` files
- Use kebab-case for folder and file names

#### `/src/app/services`
Business logic, state management, and API communication.

**Key Services**:
- `ChatService` - Conversation and message management
- `LlmApiService` - Backend API communication
- `DocumentService` - RAG document handling
- `ThemeService` - Theme management
- `MarkdownRendererService` - Content rendering

#### `/src/app/models`
TypeScript interfaces and types for data structures.

**Key Models**:
- `ChatMessage` - Individual message structure
- `Conversation` - Conversation container
- `RAGDocument` - Document for citations
- `Theme` - Theme configuration

---

## Key Concepts

### 1. Angular Signals (Not RxJS)
This project uses **Angular Signals** for reactive state management instead of RxJS Observables.

#### Creating Signals
```typescript
// Writable signal
private count = signal(0);

// Computed signal (derived state)
readonly doubled = computed(() => this.count() * 2);

// Read-only signal (exposed publicly)
get count$() { return this.count.asReadonly(); }
```

#### Using Signals
```typescript
// Read value
const value = this.count();

// Update value
this.count.set(5);
this.count.update(n => n + 1);

// In templates
{{ count() }}
```

### 2. Standalone Components
No `NgModule` needed. Components import what they need directly.

```typescript
@Component({
  selector: 'app-example',
  imports: [CommonModule, MatButtonModule],  // Import dependencies
  template: `...`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExampleComponent { }
```

### 3. Dependency Injection with `inject()`
Use function-based injection instead of constructor injection.

```typescript
export class ExampleComponent {
  private chatService = inject(ChatService);
  private dialog = inject(MatDialog);
  
  // No constructor needed for DI
}
```

### 4. Input/Output Signals
Modern Angular input/output system.

```typescript
export class ChildComponent {
  // Inputs
  data = input.required<string>();        // Required input
  optional = input<number>(0);            // Optional with default
  
  // Outputs
  clicked = output<string>();             // Event emitter
  
  handleClick() {
    this.clicked.emit('value');
  }
}
```

### 5. Native Control Flow
Use `@if`, `@for`, `@switch` instead of `*ngIf`, `*ngFor`, `*ngSwitch`.

```typescript
@if (condition) {
  <p>Shown when true</p>
}

@for (item of items; track item.id) {
  <div>{{ item.name }}</div>
}

@switch (value) {
  @case ('a') { <p>Case A</p> }
  @case ('b') { <p>Case B</p> }
  @default { <p>Default</p> }
}
```

### 6. Streaming SSE Responses
The app uses Server-Sent Events (SSE) for real-time streaming from the LLM.

**Flow**:
1. User sends message
2. `ChatService` calls `LlmApiService`
3. SSE stream opens
4. Chunks arrive in real-time
5. UI updates via signals
6. Stream completes

**Tags in Stream**:
- `<think>...</think>` - Internal reasoning
- `<tooling>...</tooling>` - Tool actions
- `<response>...</response>` - Final answer
- `metadata:` - Citation data
- `followup_questions:` - Suggested questions

---

## Development Workflow

### Daily Development

#### 1. Pull Latest Changes
```bash
git pull origin main
```

#### 2. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

#### 3. Start Dev Server
```bash
npm start
```

#### 4. Make Changes
Edit files in `src/app/`

Hot reload will automatically refresh the browser.

#### 5. Test Changes
```bash
npm test
```

Run specific tests:
```bash
ng test --include='**/component-name.spec.ts'
```

#### 6. Lint and Format
```bash
npm run lint
```

#### 7. Commit Changes
```bash
git add .
git commit -m "feat: add new feature"
```

Use conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance

#### 8. Push and Create PR
```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub/GitLab.

### Build for Production
```bash
npm run build
```

Output in `dist/` directory.

---

## Common Tasks

### Adding a New Component

#### 1. Generate Component
```bash
ng generate component components/my-component
```

#### 2. Update Component
```typescript
@Component({
  selector: 'app-my-component',
  imports: [CommonModule, /* other imports */],
  template: `...`,
  styleUrls: ['./my-component.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyComponentComponent {
  private service = inject(MyService);
  
  data = input.required<string>();
  action = output<string>();
}
```

#### 3. Add to Parent Component
```typescript
imports: [MyComponentComponent]
```

```html
<app-my-component [data]="value" (action)="handleAction($event)"></app-my-component>
```

### Adding a New Service

#### 1. Generate Service
```bash
ng generate service services/my-service
```

#### 2. Implement Service
```typescript
@Injectable({
  providedIn: 'root'
})
export class MyService {
  private data = signal<string[]>([]);
  
  readonly data$ = this.data.asReadonly();
  
  addItem(item: string): void {
    this.data.update(items => [...items, item]);
  }
}
```

#### 3. Inject in Component
```typescript
private myService = inject(MyService);
readonly data = this.myService.data$;
```

### Adding API Endpoint

#### 1. Update LlmApiService
```typescript
async newEndpoint(data: any): Promise<Response> {
  const response = await fetch(`${environment.apiUrl}/endpoint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}
```

#### 2. Call from Service/Component
```typescript
try {
  const result = await this.llmApi.newEndpoint(data);
  // Handle result
} catch (error) {
  console.error('API call failed:', error);
  // Handle error
}
```

### Adding a New Theme

#### 1. Define Theme in `theme.models.ts`
```typescript
export const THEMES: Theme[] = [
  // ... existing themes
  {
    id: 'green-orange-light',
    name: 'Green & Orange (Light)',
    mode: 'light',
    baseName: 'green-orange',
    cssClass: 'green-orange-light',
    primary: '#4caf50',
    accent: '#ff9800'
  }
];
```

#### 2. Add CSS in `styles.css`
```css
.green-orange-light {
  --primary-color: #4caf50;
  --accent-color: #ff9800;
  --background-color: #fafafa;
  --text-color: #212121;
  /* ... other variables */
}
```

### Working with Markdown/LaTeX

#### Markdown Content
```typescript
// In component template
<app-markdown-content 
  [content]="message.content"
  [citationMetadata]="message.citationMetadata">
</app-markdown-content>
```

#### Inline Math
```markdown
The equation $E = mc^2$ demonstrates...
```

#### Display Math
````markdown
```latex
\int_{a}^{b} f(x) \, dx = F(b) - F(a)
```
````

### Adding Citation Support

Citations are automatically extracted from metadata and rendered inline.

**Format**:
```typescript
citationMetadata = {
  "{uuid-here}": {
    source_id: "doc-1",
    chunks: [{
      text: "Relevant text...",
      page_numbers: [5],
      distance: 0.85
    }]
  }
}
```

**In Content**:
```markdown
This is a fact [{uuid-here}] from the document.
```

---

## Architecture Overview

### Data Flow

```
User Action
  ↓
Component (UI)
  ↓
Service (Business Logic)
  ↓
API Service (HTTP)
  ↓
Backend API
  ↓
SSE Stream (Real-time)
  ↓
Service Updates Signals
  ↓
Component Renders (Auto via Signals)
```

### State Management

**Centralized State** (in Services):
- ChatService: Conversations and messages
- DocumentService: RAG documents
- ThemeService: Current theme
- UserConfigService: User preferences

**Local State** (in Components):
- UI state (modals, expanded sections)
- Form inputs
- Temporary flags

### Communication Patterns

**Component → Service**:
```typescript
await this.chatService.sendMessage(text);
```

**Service → Component** (via Signals):
```typescript
readonly messages = this.chatService.currentMessages$;
```

**Component → Component** (via Service):
```typescript
// Component A
this.chatService.selectConversation(id);

// Component B (automatically updates)
readonly currentConv = this.chatService.currentConversation;
```

---

## Best Practices

### Code Style

#### 1. Use TypeScript Strict Mode
Already enabled in `tsconfig.json`. Avoid `any` type.

```typescript
// Bad
function process(data: any) { }

// Good
function process(data: string) { }
```

#### 2. Use OnPush Change Detection
All components should use `OnPush` strategy.

```typescript
changeDetection: ChangeDetectionStrategy.OnPush
```

#### 3. Prefer Signals over RxJS
Use signals for reactive state unless RxJS is specifically needed.

```typescript
// Preferred
private count = signal(0);

// Only if you need RxJS operators
private count$ = new BehaviorSubject(0);
```

#### 4. Keep Components Focused
Single responsibility: one component, one purpose.

```typescript
// Good: Focused component
class MessageComponent { /* display message */ }

// Bad: Multiple responsibilities
class MessageAndListComponent { /* display and manage */ }
```

#### 5. Use Computed for Derived State
```typescript
readonly isEmpty = computed(() => this.items().length === 0);
```

#### 6. Handle Errors Gracefully
```typescript
try {
  await this.service.operation();
} catch (error) {
  console.error('Operation failed:', error);
  this.showError('Something went wrong. Please try again.');
}
```

### Testing

#### Write Tests for:
- Components (rendering, events)
- Services (business logic)
- Utility functions
- API calls (with mocks)

#### Test Example
```typescript
it('should send message when button clicked', () => {
  spyOn(component, 'sendMessage');
  const button = fixture.debugElement.query(By.css('button'));
  
  button.nativeElement.click();
  
  expect(component.sendMessage).toHaveBeenCalled();
});
```

### Performance

#### 1. Use TrackBy in Loops
```typescript
@for (item of items; track item.id) {
  <div>{{ item.name }}</div>
}
```

#### 2. Lazy Load Routes
```typescript
{
  path: 'admin',
  loadComponent: () => import('./admin/admin.component')
}
```

#### 3. Avoid Expensive Operations in Templates
```typescript
// Bad
{{ expensiveCalculation(data) }}

// Good
readonly result = computed(() => expensiveCalculation(this.data()));
{{ result() }}
```

---

## Resources

### Documentation
- [Angular Official Docs](https://angular.dev)
- [Angular Signals Guide](https://angular.dev/guide/signals)
- [Angular Material](https://material.angular.io)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Project Docs
- `docs/SERVICES_OVERVIEW.md` - All services explained
- `docs/COMPONENTS_OVERVIEW.md` - All components explained
- `docs/DESIGN_DEFINITIONS.md` - Design specifications
- `docs/FUNCTIONAL_REQUIREMENTS.md` - Feature requirements
- `docs/USER_GUIDE.md` - End user documentation
- `WARP.md` - Development commands and architecture

### Helpful Commands
```bash
# Start dev server
npm start

# Run tests
npm test

# Build for production
npm run build

# Lint code
npm run lint

# Generate component
ng generate component components/name

# Generate service
ng generate service services/name

# Run Angular CLI commands
npm run ng -- <command>
```

### Getting Help

#### Internal Resources
1. Check the docs in `/docs` folder
2. Review similar components/services
3. Look at WARP.md for project-specific patterns

#### External Resources
1. Angular official documentation
2. Stack Overflow (angular tag)
3. Angular Discord/Reddit communities

#### Team
- Ask questions in team chat
- Schedule pairing sessions
- Request code reviews

---

## Next Steps

Now that you're set up:

1. **Explore the Codebase**
   - Read through key services: ChatService, LlmApiService
   - Study main components: ChatInterfaceComponent, MessageComponent
   - Review data models in `/models`

2. **Make a Small Change**
   - Try changing a button label
   - Adjust a color in the theme
   - Add a console.log to see data flow

3. **Pick Your First Task**
   - Look for "good first issue" labels
   - Start with documentation improvements
   - Fix a small bug or add a minor feature

4. **Read the Architecture Docs**
   - Understand the streaming SSE flow
   - Learn how citations work
   - Review the theme system

5. **Write Your First Test**
   - Add a test for an existing component
   - Practice with mocks and fixtures
   - Run tests and see them pass

Welcome aboard! Happy coding! 🚀
