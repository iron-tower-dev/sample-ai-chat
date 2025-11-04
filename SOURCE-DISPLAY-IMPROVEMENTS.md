# Source Display Improvements

This document describes the changes made to improve how document sources are displayed in the chat interface.

## Changes Made

### 1. Display Only `generated_response`

**Previous Behavior:**
- The assistant message displayed content from either `generated_response` or `response` field
- This could show full debug/processing information

**New Behavior:**
- Only the `generated_response` field is displayed in the message content
- This ensures users see only the clean, final answer without debug information

**Code Change:**
```typescript
// In chat.service.ts
const content = currentChunk.generated_response || '';
this.updateMessageContent(assistantMessageId, content);
```

### 2. Use `retrieved_sources` Instead of `cited_sources`

**Previous Behavior:**
- RAG documents were created from `cited_sources` array
- This might not have included all relevant source metadata

**New Behavior:**
- RAG documents are now created from `retrieved_sources` array
- This provides access to the full metadata for each source

**Code Change:**
```typescript
// In chat.service.ts
if (currentChunk.retrieved_sources && currentChunk.retrieved_sources.length > 0) {
    this.updateMessageRAGDocuments(
        assistantMessageId,
        this.convertToRAGDocuments(currentChunk.retrieved_sources, documentSources?.[0])
    );
}
```

### 3. Dataset-Specific Document Identifiers

**Previous Behavior:**
- Sources displayed generic identifiers like "Source: 4", "Source: 60"
- No distinction between different document types

**New Behavior:**
- **NRCAdams documents**: Display `AccessionNumber` from metadata (e.g., "ML21049A274")
- **eDoc documents**: Display `DocumentTitle` from metadata (e.g., "Design Specification Rev 3")
- Fallback to `documentName` or `source_id` if specific fields aren't available

**Code Change:**
```typescript
// In chat.service.ts - convertToRAGDocuments()
let title: string;
const metadata = source.metadata || {};

if (datasetName === 'NRCAdams' && metadata.AccessionNumber) {
    title = metadata.AccessionNumber;
} else if (metadata.DocumentTitle) {
    title = metadata.DocumentTitle;
} else if (metadata.documentName) {
    title = metadata.documentName;
} else {
    title = source.source_id || `Document ${index + 1}`;
}
```

## Data Structure

### Retrieved Source Structure

Each source in `retrieved_sources` has the following structure:

```typescript
{
  source_id: string;           // Unique identifier
  text: string;                // Excerpt of text from the document
  metadata: {
    // For NRCAdams documents:
    AccessionNumber?: string;  // e.g., "ML21049A274"
    AuthorName?: string;
    chunk_id: string;
    
    // For eDoc documents:
    DocumentTitle?: string;    // e.g., "Design Specification Rev 3"
    
    // Common fields:
    text: string;
    distance: number;          // Relevance score (lower is better)
    rank?: number;
    bounding_boxes?: string;
    milvus_id?: number;
  }
}
```

### Updated TypeScript Interfaces

```typescript
export interface RetrievedSourceMetadata {
  AccessionNumber?: string;  // For NRCAdams documents
  DocumentTitle?: string;     // For eDoc documents
  chunk_id: string;
  text: string;
  bounding_boxes?: string;
  AuthorName?: string;
  milvus_id?: number;
  distance: number;
  rank?: number;
  [key: string]: any;         // Allow additional metadata fields
}
```

## User Experience Improvements

### Before
```
AI Assistant: [Full debug output with tool reasoning, steps, etc.]

Sources used:
• Source: 4
• Source: 60
• Source: 123
```

### After
```
AI Assistant: [Clean, focused answer]

Sources used:
• ML21049A274  (NRCAdams document)
• Design Specification Rev 3  (eDoc document)
• Project Overview  (eDoc document)
```

## Implementation Details

### Method Signature Update

The `convertToRAGDocuments()` method now accepts a dataset name parameter:

```typescript
private convertToRAGDocuments(
  retrievedSources: any[], 
  datasetName?: string
): RAGDocument[]
```

This allows the method to determine which identifier field to use based on the data source.

### Document Type Detection

The system determines document types as follows:

1. **NRCAdams**: If `datasetName === 'NRCAdams'` and `AccessionNumber` exists in metadata
2. **eDoc**: If `DocumentTitle` exists in metadata
3. **Fallback**: Use `documentName` or `source_id`

### Relevance Score Calculation

Relevance scores are calculated from the distance metric:
- Distance values range from 0 (perfect match) to 1 (no match)
- Relevance = 1 - distance
- Only displayed if distance value is available

## Testing

To test these changes:

1. **NRCAdams Query**:
   - Send a query with `filtered_dataset: "NRCAdams"`
   - Verify sources show AccessionNumbers (e.g., "ML21049A274")

2. **eDoc Query**:
   - Send a query with `filtered_dataset: "eDoc"` or other dataset
   - Verify sources show DocumentTitles

3. **Content Display**:
   - Verify message content shows only clean answer text
   - Verify no debug/processing information is visible

## Files Modified

1. `src/app/services/llm-api.service.ts`
   - Updated `RetrievedSourceMetadata` interface
   - Added optional fields for different document types

2. `src/app/services/chat.service.ts`
   - Updated to use `generated_response` only
   - Changed from `cited_sources` to `retrieved_sources`
   - Enhanced `convertToRAGDocuments()` with dataset-aware title selection
   - Passes dataset name to conversion method

## Benefits

✅ **Cleaner UI**: Users see only the relevant answer, not debug information
✅ **Better Source Identification**: Meaningful identifiers instead of generic numbers
✅ **Dataset-Aware**: Automatically uses appropriate identifiers for each data source
✅ **Backward Compatible**: Fallback logic handles sources without specific fields
✅ **Type-Safe**: Full TypeScript typing for all metadata fields
