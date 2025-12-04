export interface ChatMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
    feedback?: MessageFeedback;
    ragDocuments?: RAGDocument[];
    apiMessageId?: string; // Message ID from the API response, used for feedback
    thinkingText?: string; // Text from <think> tags
    toolingText?: string; // Text from <tooling> tags (or tool actions)
    citationMetadata?: Record<string, DocumentCitationMetadata>; // Metadata for citations
    followupQuestions?: { topic: string; followups: string[] }; // Suggested followup questions
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



