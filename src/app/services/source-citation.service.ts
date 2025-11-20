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

  /** Build a link URL for a given RAG document based on its source and metadata */
  private buildDocumentUrl(document: RAGDocument, sourceId?: string): string | null {
    const sourceName = document.source?.name?.toLowerCase() || '';
    const md = (document.metadata || {}) as Record<string, any>;

    // NRC Adams: use AccessionNumber query param
    if (sourceName === 'nrcadams') {
      const accession = md['AccessionNumber'] || document.title || sourceId;
      if (accession) {
        const acc = encodeURIComponent(String(accession));
        // Public NRC ADAMS search URL pattern
        return `https://adamswebsearch2.nrc.gov/webSearch2/main.jsp?AccessionNumber=${acc}`;
      }
      return null;
    }

    // eDoc: use edocid (various casing) query param
    if (sourceName === 'edoc') {
      const edocId = md['edocid'] || md['eDocId'] || md['EDocId'] || md['edocID'];
      if (edocId) {
        const id = encodeURIComponent(String(edocId));
        // Default eDoc endpoint – adjust if your environment uses a different base path
        return `/edoc?edocid=${id}`;
      }
      return null;
    }

    return null;
  }

  /**
   * Replace inline source citations with HTML for document links
   * Handles:
   * - UUID citations like [Source: {UUID}]
   * - Numeric citations like [Source: 7]
   * - Multiple citations like [Source: 7, 26, 38]
   * 
   * @param content The content containing [Source: ...] patterns
   * @param ragDocuments Array of RAG documents (not used with UUID citations)
   * @param citationMetadata Optional metadata map from UUID to DocumentCitationMetadata
   */
  replaceSourceCitationsWithHTML(
    content: string,
    ragDocuments: RAGDocument[],
    citationMetadata?: Record<string, any>
  ): string {
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
      
      // Check if this is a UUID citation pattern {UUID}
      const isUUID = identifiers.trim().startsWith('{') && identifiers.trim().endsWith('}');
      
      if (isUUID && citationMetadata) {
        // Handle UUID-based citation using metadata
        const uuid = identifiers.trim();
        const docMetadata = citationMetadata[uuid];
        
        if (docMetadata) {
          const title = docMetadata.DocumentTitle || 'Unknown Document';
          const docData = encodeURIComponent(JSON.stringify({
            uuid: uuid,
            title: title,
            metadata: docMetadata
          }));
          
          const label = `[${title}]`;
          
          // Check if we can build an external URL
          if (docMetadata.eDocID || docMetadata.PathName) {
            const edocId = docMetadata.eDocID || docMetadata.edocID;
            if (edocId) {
              const url = `/edoc?edocid=${encodeURIComponent(edocId)}`;
              return `<a class="inline-source-citation" href="${url}" target="_blank" rel="noopener noreferrer" title="${title}" data-doc="${docData}" data-uuid="${uuid}">${label}</a>`;
            }
          }
          
          // No external URL, make it a clickable link for preview
          return `<a class="inline-source-citation" href="#" title="${title}" data-doc="${docData}" data-uuid="${uuid}">${label}</a>`;
        } else {
          console.warn('[SourceCitationService] No metadata found for UUID:', uuid);
          // Return the original citation if no metadata
          return match;
        }
      }
      
      // Split by comma AND semicolon to handle multiple sources like "6, 1.1.1; Source 23, 4.11"
      // First normalize by replacing "; Source" with just ","
      const normalizedIdentifiers = identifiers.replace(/;\s*Source\s+/gi, ', ');
      const sourceIds = normalizedIdentifiers.split(/[,;]/).map((id: string) => id.trim()).filter((id: string) => id.length > 0);
      
      // Remove duplicate source IDs while preserving order
      const uniqueSourceIds: string[] = Array.from(new Set(sourceIds));
      
      // Map source IDs to documents and track unique titles
      const seenTitles = new Set<string>();
      const citations: string[] = [];
      
      for (const sourceId of uniqueSourceIds) {
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
          // Only add if we haven't seen this document title before
          if (!seenTitles.has(document.title)) {
            seenTitles.add(document.title);

            // Check if document has required metadata
            const md = (document.metadata || {}) as Record<string, any>;
            const sourceName = document.source?.name?.toLowerCase() || '';
            
            // Helper to check for truthy non-empty values
            const hasValue = (val: any): boolean => {
              return val !== null && val !== undefined && val !== '';
            };
            
            const hasTitle = hasValue(document.title) && document.title !== 'Unknown Document';
            const hasEdocId = hasValue(md['edocid']) || hasValue(md['eDocId']) || hasValue(md['EDocId']) || hasValue(md['edocID']);
            const hasAccessionNumber = hasValue(md['AccessionNumber']);
            
            // Skip citation if missing required metadata
            let shouldSkip = false;
            if (sourceName === 'nrcadams' && !hasAccessionNumber && !hasTitle) {
              console.warn('[SourceCitationService] Skipping NRCAdams citation - no AccessionNumber or title for', sourceId);
              shouldSkip = true;
            } else if (sourceName === 'edoc' && !hasEdocId && !hasTitle) {
              console.warn('[SourceCitationService] Skipping eDoc citation - no edocid or title for', sourceId);
              shouldSkip = true;
            } else if (!hasTitle) {
              console.warn('[SourceCitationService] Skipping citation - no title for', sourceId);
              shouldSkip = true;
            }

            if (!shouldSkip) {
              const docData = encodeURIComponent(JSON.stringify({
                id: document.id,
                title: document.title,
                sourceId: sourceId
              }));
              console.log('[SourceCitationService] Found document for', sourceId, ':', document.title);

              // Build a clickable link when possible
              const url = this.buildDocumentUrl(document, sourceId);
              const label = `[${document.title}]`;
              if (url) {
                // External URL - open in new tab, but also provide data for preview
                citations.push(`<a class=\"inline-source-citation\" href=\"${url}\" target=\"_blank\" rel=\"noopener noreferrer\" title=\"${document.title}\" data-doc=\"${docData}\" data-external-url=\"${url}\">${label}</a>`);
              } else {
                // No external URL - make it a clickable link that will show preview
                citations.push(`<a class=\"inline-source-citation\" href=\"#\" title=\"${document.title}\" data-doc=\"${docData}\">${label}</a>`);
              }
            }
          } else {
            console.log('[SourceCitationService] Skipping duplicate title for', sourceId, ':', document.title);
          }
        } else {
          console.warn('[SourceCitationService] No document found for source:', sourceId);
        }
      }
      
      // Join multiple citations with spaces
      return citations.join(' ');
    });
    
    console.log('[SourceCitationService] Processed result (first 200 chars):', result.substring(0, 200));
    return result;
  }
}
