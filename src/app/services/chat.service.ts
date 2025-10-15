import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ChatMessage, Conversation, ChatRequest, ChatResponse, LLMModel, DocumentSource, RAGDocument, MessageFeedback, FeedbackRequest } from '../models/chat.models';
import { UserConfigService } from './user-config.service';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private http = inject(HttpClient);
    private userConfig = inject(UserConfigService);
    
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

            // Get or create thread_id (conversation ID)
            let threadId = this.currentConversationId();
            if (!threadId) {
                threadId = this.generateId();
                this.currentConversationId.set(threadId);
            }

            // Create chat request
            const request: ChatRequest = {
                user_id: this.userConfig.userId$(),
                ad_group: this.userConfig.adGroup$(),
                prompt: message,
                thread_id: threadId,
                session_id: this.generateId(),
                system_prompt: '',
                persona: '',
                tool_override: documentSources?.length ? 'searchdoc' : undefined,
                filtered_dataset: documentSources,
                metadata_filters: documentFilters
            };

            // Call actual API
            const response = await this.callChatAPI(request);

            // Convert response to ChatMessage
            const assistantMessage: ChatMessage = {
                id: this.generateId(),
                content: response.generated_response,
                role: 'assistant',
                timestamp: new Date(),
                model,
                ragDocuments: this.convertToRAGDocuments(response.cited_sources)
            };

            // Add assistant response
            this.addMessageToCurrentConversation(assistantMessage);

            // Update conversation title if it's the first message
            const currentConv = this.currentConversation();
            if (currentConv && currentConv.messages.length === 2) {
                this.updateConversationTitle(threadId, response.topic || message.substring(0, 50));
            }

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

    private async callChatAPI(request: ChatRequest): Promise<ChatResponse> {
        const url = `${environment.apiUrl}/chat`;
        
        try {
            const response = await firstValueFrom(
                this.http.post<ChatResponse>(url, request, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
            );
            return response;
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    private convertToRAGDocuments(citedSources: any[]): RAGDocument[] {
        if (!citedSources || citedSources.length === 0) {
            return [];
        }

        return citedSources.map((source, index) => {
            const docSource: DocumentSource = {
                id: source.metadata?.source || 'unknown',
                name: source.metadata?.documentName || 'Unknown Document',
                type: 'external',
                requiresAuth: false
            };

            return {
                id: this.generateId(),
                title: source.metadata?.documentName || `Document ${index + 1}`,
                content: source.text || '',
                source: docSource,
                metadata: source.metadata || {},
                pageNumber: source.metadata?.pageNumber,
                relevanceScore: source.metadata?.relevanceScore
            };
        });
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
        try {
            // Create feedback object
            const feedback: MessageFeedback = {
                id: this.generateId(),
                messageId,
                type,
                timestamp: new Date(),
                comment
            };

            // Update the message with feedback
            this.conversations.update(convs =>
                convs.map(conv => ({
                    ...conv,
                    messages: conv.messages.map(msg =>
                        msg.id === messageId
                            ? { ...msg, feedback }
                            : msg
                    )
                }))
            );

            // Save conversations to localStorage
            this.saveConversations();

            // Call feedback API
            const feedbackRequest: FeedbackRequest = {
                thread_id: this.currentConversationId() || '',
                message_id: messageId,
                feedback_sign: type,
                feedback_text: comment
            };

            await firstValueFrom(
                this.http.post(`${environment.apiUrl}/feedback`, feedbackRequest, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
            );

            console.log('Feedback submitted successfully');
        } catch (error) {
            console.error('Error submitting feedback:', error);
            throw error;
        }
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

    private updateConversationTitle(conversationId: string, title: string): void {
        this.conversations.update(convs =>
            convs.map(conv =>
                conv.id === conversationId
                    ? { ...conv, title: title.substring(0, 50) }
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

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}
