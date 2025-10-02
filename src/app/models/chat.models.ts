export interface ChatMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
    model?: string;
    feedback?: MessageFeedback;
    ragDocuments?: RAGDocument[];
}

export interface MessageFeedback {
    id: string;
    messageId: string;
    type: 'positive' | 'negative';
    timestamp: Date;
    comment?: string;
}

export interface Conversation {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
    model?: string;
}

export interface RAGDocument {
    id: string;
    title: string;
    content: string;
    source: DocumentSource;
    metadata: DocumentMetadata;
    pageNumber?: number;
    relevanceScore?: number;
}

export interface DocumentSource {
    id: string;
    name: string;
    type: 'external' | 'internal';
    requiresAuth: boolean;
    allowedGroups?: string[];
}

export interface DocumentMetadata {
    dateAdded: Date;
    documentName: string;
    pageNumber?: number;
    author?: string;
    category?: string;
    tags?: string[];
    [key: string]: any; // Allow for additional metadata fields
}

export interface LLMModel {
    id: string;
    name: string;
    description?: string;
    isAvailable: boolean;
    maxTokens?: number;
}

export interface ChatRequest {
    message: string;
    conversationId?: string;
    model: string;
    documentSources?: string[];
    documentFilters?: DocumentFilter[];
}

export interface DocumentFilter {
    sourceId: string;
    metadataFilters: Record<string, any>;
}

export interface ChatResponse {
    message: ChatMessage;
    ragDocuments: RAGDocument[];
    model: string;
    conversationId: string;
}
