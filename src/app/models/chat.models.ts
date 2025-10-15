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
    user_id: string;
    ad_group: string;
    prompt: string;
    thread_id: string;
    session_id: string;
    system_prompt?: string;
    persona?: string;
    tool_override?: 'searchdoc' | 'querydb';
    filtered_dataset?: any;
    metadata_filters?: any;
}

export interface DocumentFilter {
    sourceId: string;
    metadataFilters: Record<string, any>;
}

export interface ChatResponse {
    thread_id: string;
    tool_call_reasoning: string;
    generated_reasoning: string;
    generated_response: string;
    guardrail_reasoning: string;
    guardrail_response: string;
    cited_sources: CitedSource[];
    retrieved_sources: RetrievedSource[];
    topic: string;
    summary: string;
    retrieval_time: number;
    generation_time: number;
    guardrail_time: number;
}

export interface CitedSource {
    text: string;
    metadata: DocumentMetadata;
}

export interface RetrievedSource {
    text: string;
    metadata: DocumentMetadata;
}

export interface FeedbackRequest {
    thread_id: string;
    message_id: string;
    feedback_sign: 'positive' | 'negative' | 'neutral';
    feedback_text?: string;
}
