# Inline Source Citations

This document describes the inline source citation feature that replaces `[Source N]` references in LLM responses with clickable document links.

## Overview

Instead of displaying document sources in a separate section at the bottom of messages, the application now:
1. Parses the `generated_response` text for inline source citations (e.g., `[Source 6]`)
2. Matches them to documents in `retrieved_sources` by `source_id`
3. Replaces citations with clickable inline links showing document titles
4. Displays appropriate identifiers based on dataset type (AccessionNumber for NRCAdams, DocumentTitle for eDoc)

## How It Works

### 1. Source Citation Patterns

The system recognizes the following patterns in the LLM response:
- `[Source 6]` - Numeric source reference
- `[Source: ML21049A274]` - Source with specific identifier
- `[Source: 123]` - Source with numeric identifier

### 2. Document Matching

When a source citation is found, the system attempts to match it to a document using:

1. **Direct source_id lookup**: Checks if the identifier matches a `source_id` in `retrieved_sources`
2. **Title lookup**: Checks if the identifier matches a document title
3. **Numeric index**: If the identifier is a number, uses it as an array index

### 3. Display Logic

**For NRCAdams documents:**
```
[Source 6] → [ML21049A274]
```

**For eDoc documents:**
```
[Source 3] → [Design Specification Rev 3]
```

**When no match found:**
```
[Source 99] → [Source 99]  (original text preserved)
```

## Architecture

### New Service: SourceCitationService

Located at `src/app/services/source-citation.service.ts`

#### Key Methods:

**`parseInlineSources(content: string, ragDocuments: RAGDocument[]): ParsedContent`**
- Parses content and extracts source citation segments
- Returns structured data with text and source segments

**`replaceSourceCitationsWithHTML(content: string, ragDocuments: RAGDocument[]): string`**
- Replaces source citations with HTML for inline display
- Returns modified content with clickable spans

### Updated Components

#### MarkdownContentComponent
- Now accepts `ragDocuments` input parameter
- Pre-processes content before markdown rendering
- Replaces source citations with HTML spans

```typescript
<app-markdown-content 
  [content]="message().content"
  [ragDocuments]="message().ragDocuments || []">
</app-markdown-content>
```

#### MessageComponent
- Removed separate "Sources used" section
- Passes RAG documents to markdown component
- Removed unused `RAGDocumentLinkComponent` import

### Updated Services

#### ChatService

**New Method: `convertToRAGDocumentsMap()`**
- Creates a map of source_id → RAGDocument
- Used for efficient lookup during source citation replacement
- Still stores documents as array in ChatMessage for backward compatibility

**Updated Method: `updateMessageRAGDocuments()`**
- Accepts both array and map formats
- Converts map to array for storage
- Maintains backward compatibility with existing code

## Data Flow

```
1. LLM Response arrives with generated_response:
   "TICAP stands for Technology-Inclusive Content [Source 6]..."

2. ChatService creates RAG documents map:
   {
     "ML21049A274": { id: "...", title: "ML21049A274", ... },
     "ML22084A223": { id: "...", title: "ML22084A223", ... }
   }

3. Stores as array in ChatMessage:
   ragDocuments: [
     { id: "...", title: "ML21049A274", source: { id: "ML21049A274" } },
     { id: "...", title: "ML22084A223", source: { id: "ML22084A223" } }
   ]

4. MarkdownContentComponent receives content and documents:
   - Calls SourceCitationService.replaceSourceCitationsWithHTML()
   - Replaces [Source 6] with <span class="inline-source-citation">[ML21049A274]</span>

5. Markdown is rendered with inline citations as clickable links
```

## CSS Styling

Inline source citations are styled with:

```css
.inline-source-citation {
  color: var(--mat-primary-500);
  cursor: pointer;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.inline-source-citation:hover {
  border-bottom-color: var(--mat-primary-500);
  color: var(--mat-primary-700);
}
```

## Examples

### Example 1: NRCAdams Response

**LLM Response:**
```
TICAP stands for Technology-Inclusive Content of Application Project [Source 1]. 
It is an industry-led activity focused on providing guidance [Source 3].
```

**Retrieved Sources:**
```json
[
  {
    "source_id": "ML21049A274",
    "text": "...",
    "metadata": { "AccessionNumber": "ML21049A274" }
  },
  {
    "source_id": "ML22084A223",
    "text": "...",
    "metadata": { "AccessionNumber": "ML22084A223" }
  }
]
```

**Rendered Output:**
```
TICAP stands for Technology-Inclusive Content of Application Project [ML21049A274]. 
It is an industry-led activity focused on providing guidance [ML22084A223].
```

### Example 2: eDoc Response

**LLM Response:**
```
According to the design specification [Source 1], the system supports [Source 2].
```

**Retrieved Sources:**
```json
[
  {
    "source_id": "doc_12345",
    "text": "...",
    "metadata": { "DocumentTitle": "Design Specification Rev 3" }
  },
  {
    "source_id": "doc_67890",
    "text": "...",
    "metadata": { "DocumentTitle": "Technical Requirements" }
  }
]
```

**Rendered Output:**
```
According to the design specification [Design Specification Rev 3], 
the system supports [Technical Requirements].
```

## Benefits

✅ **Contextual Sources**: Sources appear inline where they're referenced, not in a separate list
✅ **Cleaner UI**: No separate "Sources used" section cluttering the message
✅ **Better UX**: Users can immediately see which source supports each claim
✅ **Consistent Styling**: Sources styled consistently with other inline elements
✅ **Selective Display**: Only shows sources that are actually cited in the response
✅ **Dataset-Aware**: Automatically uses appropriate identifiers (AccessionNumber vs DocumentTitle)

## Technical Details

### Source Citation Regex

```typescript
const sourcePattern = /\[Source:?\s*([^\]]+)\]/gi;
```

This regex matches:
- `[Source 6]`
- `[Source: ML21049A274]`
- `[Source:123]`
- `[Source: any text here]`

### Document Lookup Priority

1. Direct `source_id` match in document map
2. Document `title` match in document map
3. Numeric index in `ragDocuments` array (if identifier is a number)
4. No match → preserve original text

### HTML Generation

Matched sources are replaced with:
```html
<span class="inline-source-citation" data-doc="...">
  [Document Title]
</span>
```

The `data-doc` attribute contains encoded JSON with:
- Document ID
- Document title
- Source identifier

## Future Enhancements

Potential improvements:

1. **Hover Previews**: Show document excerpt on hover (like current RAGDocumentLinkComponent)
2. **Click Actions**: Open full document view when clicked
3. **Duplicate Detection**: Combine multiple references to the same source
4. **Custom Formatting**: Support different citation styles (footnotes, superscripts, etc.)
5. **Accessibility**: Add ARIA labels for screen readers

## Files Modified

1. **New Files:**
   - `src/app/services/source-citation.service.ts` - Core citation parsing logic

2. **Modified Files:**
   - `src/app/services/chat.service.ts` - Added `convertToRAGDocumentsMap()` method
   - `src/app/components/markdown-content/markdown-content.component.ts` - Added ragDocuments input, integrated citation service
   - `src/app/components/markdown-content/markdown-content.component.css` - Added inline citation styles
   - `src/app/components/message/message.component.ts` - Removed sources section, passes documents to markdown

## Testing

To test inline source citations:

1. **Send a query** that will return sources
2. **Check the response** contains `[Source N]` patterns in `generated_response`
3. **Verify** the inline citations are:
   - Replaced with document titles
   - Styled as clickable links
   - Using correct identifiers (AccessionNumber for NRCAdams, DocumentTitle for eDoc)
4. **Confirm** no separate "Sources used" section appears at the bottom

## Backward Compatibility

The system maintains backward compatibility:
- RAG documents are still stored as arrays in `ChatMessage`
- The `ragDocuments` field in ChatMessage remains unchanged
- Existing code that reads `message.ragDocuments` continues to work
- Only the display mechanism has changed
