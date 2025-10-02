import { Injectable, signal, computed } from '@angular/core';
import { ChatMessage, Conversation, ChatRequest, ChatResponse, LLMModel, DocumentSource, RAGDocument } from '../models/chat.models';

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private conversations = signal<Conversation[]>([]);
    private currentConversationId = signal<string | null>(null);
    private availableModels = signal<LLMModel[]>([]);
    private documentSources = signal<DocumentSource[]>([]);
    private isLoading = signal(false);

    // Computed signals
    readonly currentConversation = computed(() => {
        const id = this.currentConversationId();
        return this.conversations().find(conv => conv.id === id) || null;
    });

    readonly currentMessages = computed(() => {
        return this.currentConversation()?.messages || [];
    });

    readonly hasConversations = computed(() => {
        return this.conversations().length > 0;
    });

    // Public getters
    get conversations$() { return this.conversations.asReadonly(); }
    get currentConversationId$() { return this.currentConversationId.asReadonly(); }
    get currentMessages$() { return this.currentMessages; }
    get availableModels$() { return this.availableModels.asReadonly(); }
    get documentSources$() { return this.documentSources.asReadonly(); }
    get isLoading$() { return this.isLoading.asReadonly(); }

    constructor() {
        this.initializeData();
    }

    private initializeData(): void {
        // Initialize with sample data - replace with actual API calls
        this.availableModels.set([
            {
                id: 'llama-3.1-8b',
                name: 'Llama 3.1 8B',
                description: 'Fast and efficient model for general tasks',
                isAvailable: true,
                maxTokens: 4096
            },
            {
                id: 'llama-3.1-70b',
                name: 'Llama 3.1 70B',
                description: 'High-quality model for complex tasks',
                isAvailable: true,
                maxTokens: 8192
            }
        ]);

        this.documentSources.set([
            {
                id: 'external-docs',
                name: 'External Documentation',
                type: 'external',
                requiresAuth: false
            },
            {
                id: 'internal-docs',
                name: 'Internal Documentation',
                type: 'internal',
                requiresAuth: true,
                allowedGroups: ['engineers', 'managers', 'admins']
            }
        ]);

        // Load conversations from localStorage
        this.loadConversations();
    }

    async sendMessage(message: string, model: string, documentSources?: string[], documentFilters?: any[]): Promise<void> {
        this.isLoading.set(true);

        try {
            // Create user message
            const userMessage: ChatMessage = {
                id: this.generateId(),
                content: message,
                role: 'user',
                timestamp: new Date(),
                model
            };

            // Add user message to current conversation
            this.addMessageToCurrentConversation(userMessage);

            // Create chat request
            const request: ChatRequest = {
                message,
                conversationId: this.currentConversationId() || undefined,
                model,
                documentSources,
                documentFilters
            };

            // TODO: Replace with actual API call
            const response = await this.simulateAPIResponse(request);

            // Add assistant response
            this.addMessageToCurrentConversation(response.message);

            // Save conversations
            this.saveConversations();

        } catch (error) {
            console.error('Error sending message:', error);
            // Add error message
            const errorMessage: ChatMessage = {
                id: this.generateId(),
                content: 'Sorry, I encountered an error processing your request. Please try again.',
                role: 'assistant',
                timestamp: new Date(),
                model
            };
            this.addMessageToCurrentConversation(errorMessage);
        } finally {
            this.isLoading.set(false);
        }
    }

    private async simulateAPIResponse(request: ChatRequest): Promise<ChatResponse> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        // Simulate response with RAG documents
        const ragDocuments: RAGDocument[] = [
            {
                id: this.generateId(),
                title: 'Sample Document 1',
                content: 'This is a sample document content that was used to generate the response.',
                source: this.documentSources()[0],
                metadata: {
                    dateAdded: new Date('2024-01-15'),
                    documentName: 'API Documentation',
                    pageNumber: 1,
                    author: 'John Doe',
                    category: 'Technical'
                },
                pageNumber: 1,
                relevanceScore: 0.95
            }
        ];

        // Generate sample markdown content based on the request
        const sampleContent = this.generateSampleMarkdownResponse(request.message);

        const response: ChatResponse = {
            message: {
                id: this.generateId(),
                content: sampleContent,
                role: 'assistant',
                timestamp: new Date(),
                model: request.model,
                ragDocuments
            },
            ragDocuments,
            model: request.model,
            conversationId: request.conversationId || this.generateId()
        };

        return response;
    }

    createNewConversation(title?: string): string {
        const conversation: Conversation = {
            id: this.generateId(),
            title: title || `Conversation ${this.conversations().length + 1}`,
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.conversations.update(convs => [...convs, conversation]);
        this.currentConversationId.set(conversation.id);
        this.saveConversations();

        return conversation.id;
    }

    selectConversation(conversationId: string): void {
        this.currentConversationId.set(conversationId);
    }

    deleteConversation(conversationId: string): void {
        this.conversations.update(convs => convs.filter(conv => conv.id !== conversationId));

        if (this.currentConversationId() === conversationId) {
            const remaining = this.conversations();
            this.currentConversationId.set(remaining.length > 0 ? remaining[0].id : null);
        }

        this.saveConversations();
    }

    async submitFeedback(messageId: string, type: 'positive' | 'negative', comment?: string): Promise<void> {
        // TODO: Implement API call to submit feedback
        console.log('Submitting feedback:', { messageId, type, comment });

        // For now, just log the feedback
        // In a real implementation, this would call the backend API
    }

    private addMessageToCurrentConversation(message: ChatMessage): void {
        const conversationId = this.currentConversationId();
        if (!conversationId) {
            // Create new conversation if none exists
            this.createNewConversation();
            this.addMessageToCurrentConversation(message);
            return;
        }

        this.conversations.update(convs =>
            convs.map(conv =>
                conv.id === conversationId
                    ? {
                        ...conv,
                        messages: [...conv.messages, message],
                        updatedAt: new Date()
                    }
                    : conv
            )
        );
    }

    private loadConversations(): void {
        try {
            const stored = localStorage.getItem('chat-conversations');
            if (stored) {
                const conversations = JSON.parse(stored).map((conv: any) => ({
                    ...conv,
                    createdAt: new Date(conv.createdAt),
                    updatedAt: new Date(conv.updatedAt),
                    messages: conv.messages.map((msg: any) => ({
                        ...msg,
                        timestamp: new Date(msg.timestamp)
                    }))
                }));
                this.conversations.set(conversations);
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    }

    private saveConversations(): void {
        try {
            localStorage.setItem('chat-conversations', JSON.stringify(this.conversations()));
        } catch (error) {
            console.error('Error saving conversations:', error);
        }
    }

    private generateSampleMarkdownResponse(userMessage: string): string {
        const lowerMessage = userMessage.toLowerCase();

        if (lowerMessage.includes('math') || lowerMessage.includes('equation') || lowerMessage.includes('formula')) {
            return `# Mathematical Response

Here's a mathematical explanation with LaTeX rendering:

## Quadratic Formula

The quadratic formula is: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$

## Example Calculation

For the equation $x^2 + 5x + 6 = 0$:

\`\`\`latex
x = \\frac{-5 \\pm \\sqrt{25 - 24}}{2} = \\frac{-5 \\pm 1}{2}
\`\`\`

This gives us:
- $x_1 = \\frac{-5 + 1}{2} = -2$
- $x_2 = \\frac{-5 - 1}{2} = -3$

## Code Example

Here's how you might implement this in Python:

\`\`\`python
import math

def quadratic_formula(a, b, c):
    discriminant = b**2 - 4*a*c
    if discriminant >= 0:
        x1 = (-b + math.sqrt(discriminant)) / (2*a)
        x2 = (-b - math.sqrt(discriminant)) / (2*a)
        return x1, x2
    else:
        return None, None
\`\`\`

The solution is **x = -2** or **x = -3**.`;
        }

        if (lowerMessage.includes('code') || lowerMessage.includes('programming')) {
            return `# Code Example

Here's a comprehensive code example with syntax highlighting:

## Algorithm Implementation

\`\`\`typescript
interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

class ChatService {
  private messages: ChatMessage[] = [];
  
  async sendMessage(content: string): Promise<void> {
    const message: ChatMessage = {
      id: this.generateId(),
      content,
      role: 'user',
      timestamp: new Date()
    };
    
    this.messages.push(message);
    // Process message...
  }
  
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
\`\`\`

## Key Features

- **Type Safety**: Full TypeScript support
- **Async Operations**: Promise-based API
- **Error Handling**: Robust error management
- **Performance**: Optimized for real-time chat

> **Note**: This is a simplified example. In production, you'd want to add proper error handling and validation.`;
        }

        if (lowerMessage.includes('list') || lowerMessage.includes('steps')) {
            return `# Step-by-Step Guide

Here's a comprehensive guide with multiple sections:

## Prerequisites

Before starting, ensure you have:

1. **Node.js** (version 18 or higher)
2. **Angular CLI** installed globally
3. **Git** for version control
4. **Code editor** (VS Code recommended)

## Installation Steps

### Step 1: Create Project
\`\`\`bash
ng new my-chat-app
cd my-chat-app
\`\`\`

### Step 2: Install Dependencies
\`\`\`bash
npm install @angular/material @angular/cdk
\`\`\`

### Step 3: Configure Theme
Add to your \`styles.css\`:
\`\`\`css
@import '@angular/material/prebuilt-themes/indigo-pink.css';
\`\`\`

## Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| Theme | Material Design | Professional UI components |
| State Management | Signals | Reactive state handling |
| Styling | CSS Variables | Dynamic theming support |

## Next Steps

- [ ] Set up routing
- [ ] Implement authentication
- [ ] Add real-time features
- [ ] Deploy to production

**Important**: Remember to test thoroughly before deployment!`;
        }

        // Default response with some markdown
        return `# Response to: "${userMessage}"

This is a **simulated response** that demonstrates markdown rendering capabilities.

## Features Demonstrated

- **Bold text** and *italic text*
- \`inline code\` formatting
- Mathematical expressions: $E = mc^2$
- Lists and structured content

## Code Block Example

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));
\`\`\`

## LaTeX Math Block

\`\`\`latex
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
\`\`\`

## Mathematical Formula

The Pythagorean theorem: $a^2 + b^2 = c^2$

## Another Math Example

Quadratic formula: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$

> This response includes various markdown elements to showcase the rendering capabilities.

The system is working correctly and ready to handle your API responses with full markdown and LaTeX support!`;
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}
