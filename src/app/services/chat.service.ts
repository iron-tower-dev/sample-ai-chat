import { Injectable, signal, computed, inject } from '@angular/core';
import { ChatMessage, Conversation, ChatRequest, ChatResponse, LLMModel, DocumentSource, RAGDocument, MessageFeedback } from '../models/chat.models';
import { UserConfigService } from './user-config.service';
import { environment } from '../../environments/environment';
import { LlmApiService, LLMRequest, FeedbackRequest } from './llm-api.service';

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private userConfig = inject(UserConfigService);
    private llmApi = inject(LlmApiService);
    
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

    async sendMessage(message: string, model: string): Promise<void> {
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

            // Get the conversation ID (for internal tracking)
            let conversationId = this.currentConversationId();
            if (!conversationId) {
                conversationId = this.generateId();
                this.currentConversationId.set(conversationId);
            }

            // Generate a unique message_id for this specific user message
            const messageId = this.generateId();

            // Create LLM API request
            const request: LLMRequest = {
                user_query: message,
                username: this.userConfig.userId$(),
                session_id: conversationId
            };

            // Create placeholder assistant message for streaming
            const assistantMessageId = this.generateId();
            const assistantMessage: ChatMessage = {
                id: assistantMessageId,
                content: '',
                role: 'assistant',
                timestamp: new Date(),
                model,
                thinkingText: '',
                toolingText: '',
                citationMetadata: {}
            };
            this.addMessageToCurrentConversation(assistantMessage);

            // Call streaming API with callback
            let fullThinkingText = '';
            let fullToolingText = '';
            let fullResponseText = '';
            let citationMetadata: Record<string, any> | undefined;

            await this.llmApi.sendMessage(request, (streamData) => {
                const { currentChunk, isComplete, error, messageId: apiMessageId } = streamData;
                
                if (error) {
                    console.error('Streaming error:', error);
                    this.updateMessageContent(
                        assistantMessageId,
                        'Sorry, I encountered an error processing your request. Please try again.'
                    );
                    this.isLoading.set(false);
                    return;
                }

                // Store API message ID for feedback
                if (apiMessageId) {
                    this.updateMessageApiMessageId(assistantMessageId, apiMessageId);
                }

                if (currentChunk) {
                    // Update thinking, tooling, and response text
                    if (currentChunk.thinkingText !== fullThinkingText) {
                        fullThinkingText = currentChunk.thinkingText;
                        this.updateMessageThinkingText(assistantMessageId, fullThinkingText);
                    }

                    if (currentChunk.toolingText !== fullToolingText) {
                        fullToolingText = currentChunk.toolingText;
                        this.updateMessageToolingText(assistantMessageId, fullToolingText);
                    }

                    if (currentChunk.responseText !== fullResponseText) {
                        fullResponseText = currentChunk.responseText;
                        this.updateMessageContent(assistantMessageId, fullResponseText);
                    }

                    // Store metadata for citations
                    if (currentChunk.metadata && !citationMetadata) {
                        citationMetadata = currentChunk.metadata;
                        this.updateMessageCitationMetadata(assistantMessageId, citationMetadata);
                    }
                }

                if (isComplete) {
                    this.isLoading.set(false);
                    this.saveConversations();
                }
            });

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
            this.isLoading.set(false);
        }
    }

    private updateMessageContent(messageId: string, content: string): void {
        this.conversations.update(convs =>
            convs.map(conv => ({
                ...conv,
                messages: conv.messages.map(msg =>
                    msg.id === messageId
                        ? { ...msg, content }
                        : msg
                )
            }))
        );
    }

    private updateMessageRAGDocuments(messageId: string, ragDocuments: RAGDocument[] | Record<string, RAGDocument>): void {
        // Convert map to array if needed for backward compatibility
        const docsArray = Array.isArray(ragDocuments) ? ragDocuments : Object.values(ragDocuments);
        
        this.conversations.update(convs =>
            convs.map(conv => ({
                ...conv,
                messages: conv.messages.map(msg =>
                    msg.id === messageId
                        ? { ...msg, ragDocuments: docsArray }
                        : msg
                )
            }))
        );
    }

    private updateMessageApiMessageId(messageId: string, apiMessageId: string): void {
        this.conversations.update(convs =>
            convs.map(conv => ({
                ...conv,
                messages: conv.messages.map(msg =>
                    msg.id === messageId
                        ? { ...msg, apiMessageId }
                        : msg
                )
            }))
        );
    }

    private updateMessageThinkingText(messageId: string, thinkingText: string): void {
        this.conversations.update(convs =>
            convs.map(conv => ({
                ...conv,
                messages: conv.messages.map(msg =>
                    msg.id === messageId
                        ? { ...msg, thinkingText }
                        : msg
                )
            }))
        );
    }

    private updateMessageToolingText(messageId: string, toolingText: string): void {
        this.conversations.update(convs =>
            convs.map(conv => ({
                ...conv,
                messages: conv.messages.map(msg =>
                    msg.id === messageId
                        ? { ...msg, toolingText }
                        : msg
                )
            }))
        );
    }

    private updateMessageCitationMetadata(messageId: string, citationMetadata: Record<string, any>): void {
        this.conversations.update(convs =>
            convs.map(conv => ({
                ...conv,
                messages: conv.messages.map(msg =>
                    msg.id === messageId
                        ? { ...msg, citationMetadata }
                        : msg
                )
            }))
        );
    }

    private convertToRAGDocumentsMap(retrievedSources: any[], datasetName?: string): Record<string, RAGDocument> {
        if (!retrievedSources || retrievedSources.length === 0) {
            return {};
        }

        const documentsMap: Record<string, RAGDocument> = {};

        retrievedSources.forEach((source) => {
            // Determine document title based on dataset type
            let title: string;
            const metadata = source.metadata || {};
            
            if (datasetName === 'NRCAdams' && metadata.AccessionNumber) {
                title = metadata.AccessionNumber;
            } else if (metadata.DocumentTitle) {
                title = metadata.DocumentTitle;
            } else if (metadata.documentName) {
                title = metadata.documentName;
            } else {
                title = source.source_id || 'Unknown Document';
            }

            const docSource: DocumentSource = {
                id: source.source_id || 'unknown',
                name: datasetName || 'Unknown Source',
                type: datasetName === 'NRCAdams' ? 'external' : 'internal',
                requiresAuth: datasetName !== 'NRCAdams'
            };

            // Use source_id as the key in the map
            const sourceId = source.source_id || this.generateId();
            documentsMap[sourceId] = {
                id: this.generateId(),
                title,
                content: source.text || '',
                source: docSource,
                metadata: {
                    ...metadata,
                    documentName: title,
                    dateAdded: new Date()
                },
                relevanceScore: metadata.distance ? 1 - metadata.distance : undefined
            };
        });

        return documentsMap;
    }

    private convertToRAGDocuments(retrievedSources: any[], datasetName?: string): RAGDocument[] {
        if (!retrievedSources || retrievedSources.length === 0) {
            return [];
        }

        return retrievedSources.map((source, index) => {
            // Determine document title based on dataset type
            let title: string;
            const metadata = source.metadata || {};
            
            if (datasetName === 'NRCAdams' && metadata.AccessionNumber) {
                title = metadata.AccessionNumber;
            } else if (metadata.DocumentTitle) {
                title = metadata.DocumentTitle;
            } else if (metadata.documentName) {
                title = metadata.documentName;
            } else {
                title = source.source_id || `Document ${index + 1}`;
            }

            const docSource: DocumentSource = {
                id: source.source_id || 'unknown',
                name: datasetName || 'Unknown Source',
                type: datasetName === 'NRCAdams' ? 'external' : 'internal',
                requiresAuth: datasetName !== 'NRCAdams'
            };

            return {
                id: this.generateId(),
                title,
                content: source.text || '',
                source: docSource,
                metadata: {
                    ...metadata,
                    documentName: title,
                    dateAdded: new Date()
                },
                relevanceScore: metadata.distance ? 1 - metadata.distance : undefined
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
            // Find the message to get its API message_id
            let apiMessageId: string | undefined;
            for (const conv of this.conversations()) {
                const msg = conv.messages.find(m => m.id === messageId);
                if (msg) {
                    apiMessageId = msg.apiMessageId;
                    break;
                }
            }

            if (!apiMessageId) {
                throw new Error('API message_id not found for this message');
            }

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

            // Call feedback API with the API message_id
            const feedbackRequest: FeedbackRequest = {
                message_id: apiMessageId,
                feedback_sign: type,
                feedback_text: comment
            };

            await this.llmApi.submitFeedback(feedbackRequest);

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
