import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.1.392/pdf.worker.min.mjs';

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface PageBoundingBoxes {
  [pageNumber: string]: BoundingBox[];
}

@Injectable({
  providedIn: 'root'
})
export class PdfViewerService {
  /**
   * Parse bounding boxes from JSON string format
   * Format: {"42": [[80, 213, 880, 548]], "43": [[66, 61, 931, 965]]}
   */
  parseBoundingBoxes(boundingBoxesJson: string): PageBoundingBoxes {
    try {
      const parsed = JSON.parse(boundingBoxesJson);
      const result: PageBoundingBoxes = {};
      
      for (const [pageNum, boxes] of Object.entries(parsed)) {
        if (Array.isArray(boxes)) {
          result[pageNum] = boxes.map((box: number[]) => ({
            x1: box[0],
            y1: box[1],
            x2: box[2],
            y2: box[3]
          }));
        }
      }
      
      return result;
    } catch (error) {
      console.error('[PdfViewerService] Error parsing bounding boxes:', error);
      return {};
    }
  }

  /**
   * Load a PDF document from a blob URL
   */
  async loadPdfDocument(url: string): Promise<pdfjsLib.PDFDocumentProxy> {
    const loadingTask = pdfjsLib.getDocument(url);
    return await loadingTask.promise;
  }

  /**
   * Render a PDF page to a canvas with highlights
   */
  async renderPageWithHighlights(
    pdfDocument: pdfjsLib.PDFDocumentProxy,
    pageNumber: number,
    canvas: HTMLCanvasElement,
    highlights: BoundingBox[] = [],
    scale: number = 1.5
  ): Promise<void> {
    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get canvas context');
    }

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render PDF page
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    await page.render(renderContext).promise;

    // Draw highlights on top
    if (highlights.length > 0) {
      this.drawHighlights(context, highlights, viewport, scale);
    }
  }

  /**
   * Draw bounding box highlights on the canvas
   */
  private drawHighlights(
    context: CanvasRenderingContext2D,
    highlights: BoundingBox[],
    viewport: pdfjsLib.PageViewport,
    scale: number
  ): void {
    context.save();
    
    highlights.forEach(box => {
      // Convert PDF coordinates to canvas coordinates
      // PDF coordinates: origin at bottom-left
      // Canvas coordinates: origin at top-left
      const x = box.x1 * scale;
      const y = viewport.height - (box.y2 * scale); // Flip Y coordinate
      const width = (box.x2 - box.x1) * scale;
      const height = (box.y2 - box.y1) * scale;

      // Draw semi-transparent yellow highlight
      context.fillStyle = 'rgba(255, 255, 0, 0.3)';
      context.fillRect(x, y, width, height);

      // Draw border
      context.strokeStyle = 'rgba(255, 200, 0, 0.8)';
      context.lineWidth = 2;
      context.strokeRect(x, y, width, height);
    });

    context.restore();
  }

  /**
   * Get all pages that have highlights for a chunk
   */
  getPagesWithHighlights(boundingBoxes: PageBoundingBoxes): number[] {
    return Object.keys(boundingBoxes).map(Number).sort((a, b) => a - b);
  }
}
