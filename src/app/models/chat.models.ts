export interface ChatMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
    feedback?: MessageFeedback;
    ragDocuments?: RAGDocument[];
    apiMessageId?: string; // Message ID from the API response, used for feedback
    thinkingText?: string; // Text from <think> tags
    toolingText?: string; // Text from <tooling> tags
    citationMetadata?: Record<string, DocumentCitationMetadata>; // Metadata for citations
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

export interface DocumentCitationMetadata {
    DocumentTitle: string;
    eDocID: string | null;
    Revision: string;
    PathName: string;
    FileName: string;
    SWMSStatus: string;
    SWMSTitle: string;
    Category: string;
    DocType: string;
    Chunks: ChunkMetadata[];
}

export interface ChunkMetadata {
    chunk_id: string;
    pages: number[];
    bounding_boxes: string; // JSON string with page-to-bbox mapping
    relevance_score: number;
}

export interface ChatRequest {
    user_id: string;
    ad_group: string;
    prompt: string;
    message_id: string;
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

