# PDF Highlighting with Bounding Boxes

## Overview

The citation preview modal now supports PDF rendering with bounding box highlights and chunk navigation using PDF.js.

## Features

1. **PDF Rendering**: PDFs are rendered on a canvas element using PDF.js for full control over rendering
2. **Bounding Box Highlights**: Highlights are drawn as semi-transparent yellow overlays based on coordinates from the API
3. **Chunk Navigation**: Click on any chunk in the sidebar to navigate to its first page and view its highlights
4. **Page Navigation**: Use arrow buttons to navigate through PDF pages
5. **Active Chunk Indication**: The currently selected chunk is highlighted in blue in the sidebar

## Implementation Details

### PdfViewerService (`src/app/services/pdf-viewer.service.ts`)

Handles PDF rendering and highlight drawing:
- `loadPdfDocument()`: Loads PDF from blob URL
- `parseBoundingBoxes()`: Parses bounding box JSON from API (format: `{"42": [[x1, y1, x2, y2]]}`)
- `renderPageWithHighlights()`: Renders PDF page to canvas with highlight overlays
- Coordinate conversion: PDF coordinates (origin bottom-left) → Canvas coordinates (origin top-left)

### CitationPreviewModalComponent

Updated to use canvas-based rendering:
- `@ViewChild('pdfCanvas')`: References the canvas element
- `navigateToChunk()`: Navigates to chunk's first page and shows highlights
- `renderCurrentPage()`: Renders current page with appropriate highlights
- `getCurrentPageHighlights()`: Gets highlights for current page (all highlights or just from selected chunk)

## Bounding Box Format

The API returns bounding boxes as a JSON string in the `ChunkMetadata.bounding_boxes` field:

```json
{
  "42": [[80, 213, 880, 548], [100, 600, 900, 750]],
  "43": [[66, 61, 931, 965]]
}
```

- Keys are page numbers (as strings)
- Values are arrays of bounding boxes
- Each box is `[x1, y1, x2, y2]` in PDF coordinate space

## Usage

1. **Install dependencies**: Run `npm install` to install `pdfjs-dist@4.1.392`
2. **Open citation modal**: Click on a document citation in the chat
3. **Navigate**: Use page controls or click chunk buttons
4. **View highlights**: Yellow highlights show bounding boxes on the current page

## Customization

### Highlight Colors

In `PdfViewerService.drawHighlights()`:
```typescript
// Fill color (semi-transparent yellow)
context.fillStyle = 'rgba(255, 255, 0, 0.3)';

// Border color
context.strokeStyle = 'rgba(255, 200, 0, 0.8)';
context.lineWidth = 2;
```

### PDF Scale

Adjust rendering scale in `renderPageWithHighlights()`:
```typescript
const scale = 1.5; // Default scale factor
```

### Active Chunk Style

In component styles, `.chunk-btn.active` controls the active chunk appearance.

## Troubleshooting

### PDF Not Loading
- Check console for error messages
- Verify API endpoint returns valid PDF blob
- Ensure PDF.js worker URL is accessible

### Highlights Not Showing
- Verify `bounding_boxes` field exists in API response
- Check console for parsing errors
- Ensure page numbers in bounding boxes match actual PDF pages

### Coordinate Issues
- PDF coordinates use bottom-left origin
- Canvas uses top-left origin
- Conversion happens in `drawHighlights()` method

## Future Enhancements

- Zoom in/out controls
- Highlight multiple chunks simultaneously
- Different colors for different chunks
- Text selection on PDF
- Download with highlights burned in
