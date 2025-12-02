import { Injectable } from '@angular/core';
import { RAGDocument } from '../models/chat.models';
import { environment } from '../../environments/environment';

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

    // eDoc: use get_document endpoint with filepath and filename
    if (sourceName === 'edoc') {
      const pathname = md['PathName'];
      const filename = md['FileName'];
      if (pathname && filename) {
        const filepath = encodeURIComponent(String(pathname));
        const fn = encodeURIComponent(String(filename));
        return `${environment.apiUrl}/get_document?filepath=${filepath}&filename=${fn}`;
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
    if (citationMetadata) {
      console.log('[SourceCitationService] Citation metadata: present with ' + Object.keys(citationMetadata).length + ' keys:', Object.keys(citationMetadata).slice(0, 3));
    } else {
      console.log('[SourceCitationService] Citation metadata: NOT PROVIDED');
    }
    
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
      
      // Check if this contains UUID pattern(s)
      // UUIDs can be with or without braces: {UUID} or just UUID
      // UUID format: 8-4-4-4-12 hex digits
      const uuidRegex = /[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}/gi;
      const hasUUIDs = uuidRegex.test(identifiers);
      console.log('[SourceCitationService] hasUUIDs:', hasUUIDs, 'citationMetadata exists:', !!citationMetadata);
      
      if (hasUUIDs && citationMetadata && Object.keys(citationMetadata).length > 0) {
        // Extract all UUIDs from the identifiers string
        // UUIDs can be with or without braces
        const uuidPattern = /\{?[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}\}?/gi;
        const uuids = identifiers.match(uuidPattern) || [];
        
        if (uuids.length === 0) {
          console.warn('[SourceCitationService] No valid UUIDs found in:', identifiers);
          return match;
        }
        
        const citations: string[] = [];
        const seenTitles = new Set<string>();
        
        for (const uuid of uuids) {
          console.log('[SourceCitationService] Looking up UUID:', uuid);
          
          // Normalize UUID format: metadata keys always have braces
          // Response text may or may not have braces
          let normalizedUuid = uuid;
          if (!uuid.startsWith('{')) {
            normalizedUuid = '{' + uuid + '}';
          }
          console.log('[SourceCitationService] Normalized UUID for lookup:', normalizedUuid);
          
          // Try lookup with normalized (braced) UUID
          let docMetadata = citationMetadata[normalizedUuid];
          let lookupKey = normalizedUuid;
          console.log('[SourceCitationService] Lookup result:', docMetadata ? 'FOUND' : 'NOT FOUND');
          
          if (!docMetadata) {
            // Try without braces as fallback
            const uuidWithoutBraces = uuid.replace(/[{}]/g, '');
            console.log('[SourceCitationService] Trying without braces:', uuidWithoutBraces);
            docMetadata = citationMetadata[uuidWithoutBraces];
            lookupKey = uuidWithoutBraces;
            console.log('[SourceCitationService] Without braces result:', docMetadata ? 'FOUND' : 'NOT FOUND');
          }
          
          if (docMetadata) {
            console.log('[SourceCitationService] Found metadata for UUID', uuid, 'using key:', lookupKey);
            const title = docMetadata.DocumentTitle || 'Unknown Document';
            
            // Skip duplicates
            if (seenTitles.has(title)) {
              console.log('[SourceCitationService] Skipping duplicate title:', title);
              continue;
            }
            seenTitles.add(title);
            
            const docData = encodeURIComponent(JSON.stringify({
              uuid: uuid,
              title: title,
              metadata: docMetadata
            }));
            
            const label = title; // No brackets
            
              // Check if we can build an external URL using PathName and FileName
              if (docMetadata.PathName && docMetadata.FileName) {
                const filepath = encodeURIComponent(docMetadata.PathName);
                const filename = encodeURIComponent(docMetadata.FileName);
                const url = `${environment.apiUrl}/get_document?filepath=${filepath}&filename=${filename}`;
                citations.push(`<a class="inline-source-citation" href="${url}" title="${title}" data-doc="${docData}" data-uuid="${uuid}">${label}</a>`);
                continue;
              }
            
            // No external URL, make it a clickable link for preview (use javascript:void(0) to prevent navigation)
            citations.push(`<a class="inline-source-citation" href="javascript:void(0)" title="${title}" data-doc="${docData}" data-uuid="${uuid}">${label}</a>`);
          } else {
            console.warn('[SourceCitationService] No metadata found for UUID:', uuid);
          }
        }
        
        // Return all citations joined with spaces, or original if none found
        return citations.length > 0 ? citations.join(' ') : match;
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
        console.log('[SourceCitationService] Processing sourceId:', sourceId);
        
        // Try to find document by source ID
        let document = docBySourceId.get(sourceId) || docByTitle.get(sourceId);
        
        // If not found, try to match against citation metadata by DocumentTitle
        if (!document && citationMetadata) {
          console.log('[SourceCitationService] Trying to match sourceId as DocumentTitle in metadata');
          // Check if any metadata entry has a matching DocumentTitle
          for (const [uuid, metadata] of Object.entries(citationMetadata)) {
            if (metadata.DocumentTitle === sourceId) {
              console.log('[SourceCitationService] Found match by DocumentTitle:', sourceId);
              // Create a citation using the metadata
              const title = metadata.DocumentTitle;
              
              // Skip duplicates
              if (seenTitles.has(title)) {
                console.log('[SourceCitationService] Skipping duplicate title:', title);
                continue;
              }
              seenTitles.add(title);
              
              const docData = encodeURIComponent(JSON.stringify({
                uuid: uuid,
                title: title,
                metadata: metadata
              }));
              
              const label = title; // No brackets
              
              // Check if we can build an external URL using PathName and FileName
              if (metadata.PathName && metadata.FileName) {
                const filepath = encodeURIComponent(metadata.PathName);
                const filename = encodeURIComponent(metadata.FileName);
                const url = `${environment.apiUrl}/get_document?filepath=${filepath}&filename=${filename}`;
                citations.push(`<a class="inline-source-citation" href="${url}" title="${title}" data-doc="${docData}" data-uuid="${uuid}">${label}</a>`);
                break; // Found and processed, continue to next sourceId
              }
              
              // No external URL, make it a clickable link for preview (use javascript:void(0) to prevent navigation)
              citations.push(`<a class="inline-source-citation" href="javascript:void(0)" title="${title}" data-doc="${docData}" data-uuid="${uuid}">${label}</a>`);
              break; // Found and processed, continue to next sourceId
            }
          }
          
          // If we found a citation from metadata, skip the rest of the document lookup
          if (citations.length > 0 && seenTitles.has(sourceId)) {
            continue;
          }
        }
        
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
              const label = document.title; // No brackets
              if (url) {
                // External URL - will be opened in popup by click handler
                citations.push(`<a class=\"inline-source-citation\" href=\"${url}\" title=\"${document.title}\" data-doc=\"${docData}\" data-external-url=\"${url}\">${label}</a>`);
              } else {
                // No external URL - make it a clickable link that will show preview (use javascript:void(0) to prevent navigation)
                citations.push(`<a class=\"inline-source-citation\" href=\"javascript:void(0)\" title=\"${document.title}\" data-doc=\"${docData}\">${label}</a>`);
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
