import { Injectable } from '@angular/core';
import { RAGDocument } from '../models/chat.models';

export interface ParsedContent {
  segments: ContentSegment[];
}

export interface ContentSegment {
  type: 'text' | 'source';
  content: string;
  sourceId?: string;
  document?: RAGDocument;
}

@Injectable({
  providedIn: 'root'
})
export class SourceCitationService {
  /**
   * Parse content to find inline source citations like [Source 6] or [Source: ML21049A274]
   * and extract source references
   */
  parseInlineSources(content: string, ragDocuments: RAGDocument[]): ParsedContent {
    const segments: ContentSegment[] = [];
    
    // Create a map of source_id to document for quick lookup
    const docMap = new Map<string, RAGDocument>();
    ragDocuments.forEach(doc => {
      if (doc.source?.id) {
        docMap.set(doc.source.id, doc);
      }
      // Also index by title for cases where title is used
      docMap.set(doc.title, doc);
    });

    // Regex to match [Source N] or [Source: identifier]
    // Matches: [Source 6], [Source: ML21049A274], [Source: 123]
    const sourcePattern = /\[Source:?\s*([^\]]+)\]/gi;
    
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = sourcePattern.exec(content)) !== null) {
      // Add text before the source citation
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          content: content.substring(lastIndex, match.index)
        });
      }

      // Extract source identifier
      const sourceIdentifier = match[1].trim();
      
      // Try to find the matching document
      // First try direct lookup by source_id
      let document = docMap.get(sourceIdentifier);
      
      // If not found and it's a number, try finding by index in ragDocuments array
      // This is common for eDoc sources where citations are like [Source 1], [Source 2]
      if (!document && /^\d+$/.test(sourceIdentifier)) {
        const index = parseInt(sourceIdentifier, 10);
        // Try index-1 first (1-based indexing), then try 0-based indexing
        if (index - 1 >= 0 && index - 1 < ragDocuments.length) {
          document = ragDocuments[index - 1];
        } else if (index >= 0 && index < ragDocuments.length) {
          document = ragDocuments[index];
        }
      }

      // Add source citation segment
      segments.push({
        type: 'source',
        content: match[0], // Original matched text like "[Source 6]"
        sourceId: sourceIdentifier,
        document
      });

      lastIndex = sourcePattern.lastIndex;
    }

    // Add remaining text after last source citation
    if (lastIndex < content.length) {
      segments.push({
        type: 'text',
        content: content.substring(lastIndex)
      });
    }

    // If no sources were found, return the entire content as a single text segment
    if (segments.length === 0) {
      segments.push({
        type: 'text',
        content
      });
    }

    return { segments };
  }

  /**
   * Replace inline source citations with HTML for document links
   * Handles single sources like [Source: 7] and multiple sources like [Source: 7, 26, 38]
   */
  replaceSourceCitationsWithHTML(content: string, ragDocuments: RAGDocument[]): string {
    console.log('[SourceCitationService] Processing content:', content.substring(0, 200));
    console.log('[SourceCitationService] RAG documents count:', ragDocuments.length);
    
    // Create lookup maps for quick access
    const docByIndex = new Map<number, RAGDocument>();
    const docBySourceId = new Map<string, RAGDocument>();
    const docByTitle = new Map<string, RAGDocument>();
    
    ragDocuments.forEach((doc, index) => {
      docByIndex.set(index, doc);
      if (doc.source?.id) {
        docBySourceId.set(doc.source.id, doc);
      }
      if (doc.title) {
        docByTitle.set(doc.title, doc);
      }
    });
    
    // Regex to match [Source: ...] or [Source ...]
    const sourcePattern = /\[Source:?\s*([^\]]+)\]/gi;
    
    const result = content.replace(sourcePattern, (match, identifiers) => {
      console.log('[SourceCitationService] Found citation:', match, 'identifiers:', identifiers);
      
      // Split by comma AND semicolon to handle multiple sources like "6, 1.1.1; Source 23, 4.11"
      // First normalize by replacing "; Source" with just ","
      const normalizedIdentifiers = identifiers.replace(/;\s*Source\s+/gi, ', ');
      const sourceIds = normalizedIdentifiers.split(/[,;]/).map((id: string) => id.trim()).filter((id: string) => id.length > 0);
      
      // Remove duplicate source IDs while preserving order
      const uniqueSourceIds: string[] = Array.from(new Set(sourceIds));
      
      // Process each unique source ID and create citation spans
      const citations = uniqueSourceIds.map((sourceId) => {
        // Try to find document by source ID
        let document = docBySourceId.get(sourceId) || docByTitle.get(sourceId);
        
        // If not found and it's a number, try array index lookup
        if (!document && /^\d+$/.test(sourceId)) {
          const index = parseInt(sourceId, 10);
          // Try 1-based indexing first (common for LLM responses)
          document = docByIndex.get(index - 1);
          if (!document) {
            // Try 0-based as fallback
            document = docByIndex.get(index);
          }
        }
        
        if (document) {
          const docData = encodeURIComponent(JSON.stringify({
            id: document.id,
            title: document.title,
            sourceId: sourceId
          }));
          console.log('[SourceCitationService] Found document for', sourceId, ':', document.title);
          return `<span class="inline-source-citation" data-doc="${docData}">[${document.title}]</span>`;
        } else {
          console.warn('[SourceCitationService] No document found for source:', sourceId);
          return `[Source: ${sourceId}]`;
        }
      });
      
      // Join multiple citations with spaces
      return citations.join(' ');
    });
    
    console.log('[SourceCitationService] Processed result (first 200 chars):', result.substring(0, 200));
    return result;
  }
}
