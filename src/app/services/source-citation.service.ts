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
      if (!document && /^\d+$/.test(sourceIdentifier)) {
        const index = parseInt(sourceIdentifier, 10);
        if (index >= 0 && index < ragDocuments.length) {
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
   */
  replaceSourceCitationsWithHTML(content: string, ragDocuments: RAGDocument[]): string {
    const parsed = this.parseInlineSources(content, ragDocuments);
    
    let result = '';
    parsed.segments.forEach(segment => {
      if (segment.type === 'text') {
        result += segment.content;
      } else if (segment.type === 'source' && segment.document) {
        // Create a placeholder that will be replaced with the actual component
        // Use a data attribute to store the document information
        const docData = encodeURIComponent(JSON.stringify({
          id: segment.document.id,
          title: segment.document.title,
          sourceId: segment.sourceId
        }));
        result += `<span class="inline-source-citation" data-doc="${docData}">[${segment.document.title}]</span>`;
      } else {
        // Source citation without matching document - keep original
        result += segment.content;
      }
    });

    return result;
  }
}
