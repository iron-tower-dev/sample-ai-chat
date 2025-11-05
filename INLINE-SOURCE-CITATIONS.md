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

Inline source citations use a modern badge-style design for high visibility:

### Visual Design
- **Badge appearance**: Rounded corners with subtle background and border
- **Document icon**: 📄 icon prefix for immediate visual recognition
- **Elevation on hover**: Subtle lift effect with enhanced shadow
- **Theme-aware**: Adapts to light/dark themes with appropriate opacity

### Base Styles
```css
.inline-source-citation {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background-color: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 6px;
  padding: 0.125rem 0.5rem;
  font-size: 0.85em;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Interactive States
- **Default**: Subtle background with light border, slightly transparent
- **Hover**: Elevated 1px with stronger colors, enhanced shadow, full icon opacity
- **Active**: Returns to baseline (pressed effect) for tactile feedback
- **Focus**: 2px outline for keyboard navigation accessibility

### Dark Theme
```css
.dark-theme .inline-source-citation {
  color: var(--mat-primary-400);
  background-color: rgba(99, 102, 241, 0.12);
  border-color: rgba(99, 102, 241, 0.3);
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
   - Tries 1-based indexing first (e.g., `[Source 1]` → index 0)
   - Falls back to 0-based indexing if needed
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

## Streaming Features

### Typing Animation

Responses are animated character-by-character similar to ChatGPT:
- **Speed**: 20ms per character (configurable via `TYPING_SPEED_MS`)
- **Progressive Display**: Text appears one character at a time
- **Smooth Experience**: Creates a natural typing effect

### Thinking Indicator

Before the response starts streaming:
- Shows `*Thinking...*` in italic within the message bubble
- Replaced with actual response once `generated_response` arrives
- No separate loading indicator outside the message

## Prepared for Future Features

The CSS includes pre-built support for upcoming interactive features:

### 1. Hover Previews (Ready)
```css
.inline-source-citation-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  max-width: 400px;
  /* Styled with background, border, shadow */
}
```
- Tooltip container styled and positioned
- Fade-in/out transition ready
- Z-index configured for proper layering

### 2. Click Navigation (Ready)
- Cursor indicates clickability
- Focus state prepared for keyboard navigation
- Active state provides tactile feedback
- `data-doc` attribute contains document metadata

### 3. Data Attributes
- `data-preview`: Marks citations with preview capability
- `data-doc`: Encoded document JSON for click handlers

## Future Enhancements

Potential improvements not yet implemented:

1. **Document Preview Component**: Display excerpt/metadata on hover
2. **Click Handler**: Navigate to full document view
3. **Duplicate Detection**: Combine multiple references to same source
4. **Custom Icon Types**: Different icons for different document types (PDF, Word, etc.)
5. **Accessibility**: ARIA labels and announcements for screen readers
6. **Adjustable Speed**: User preference for typing animation speed
7. **Citation Numbering**: Optional superscript numbers like academic citations

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
