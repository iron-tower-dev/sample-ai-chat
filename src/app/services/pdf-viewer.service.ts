import { Injectable } from '@angular/core';
import { AnnotationFactory } from 'annotpdf';

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
   * Coordinates are normalized (0-1000 range)
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
   * Add rectangle annotations to a PDF document
   * Coordinates are normalized (0-1000) and will be converted to PDF page coordinates
   * @param pdfData The PDF file as Uint8Array
   * @param boundingBoxes Map of page numbers to bounding boxes
   * @returns Annotated PDF as Uint8Array
   */
  async addAnnotationsToPdf(
    pdfData: Uint8Array,
    boundingBoxes: PageBoundingBoxes
  ): Promise<Uint8Array> {
    try {
      console.log('[PdfViewerService] Creating annotation factory');
      const factory = new AnnotationFactory(pdfData);
      
      // Note: We assume PDF pages are standard size (US Letter: 612 x 792 points)
      // or we use a fixed scale. The coordinates are normalized (0-1000)
      // and we'll convert them assuming standard page dimensions.
      // This is a simplification - ideally we'd get actual page dimensions.
      const DEFAULT_PAGE_WIDTH = 612;  // Standard US Letter width in points
      const DEFAULT_PAGE_HEIGHT = 792; // Standard US Letter height in points
      
      // Add annotations for each page
      for (const [pageKey, boxes] of Object.entries(boundingBoxes)) {
        const pageIdx = parseInt(pageKey, 10);
        
        console.log(`[PdfViewerService] Processing page ${pageIdx} with ${boxes.length} boxes`);
        
        // Add each bounding box as a square annotation
        for (const box of boxes) {
          // Convert normalized coordinates (0-1000) to PDF page coordinates
          // Assuming standard page dimensions
          const x0 = (box.x1 / 1000) * DEFAULT_PAGE_WIDTH;
          const x1 = (box.x2 / 1000) * DEFAULT_PAGE_WIDTH;
          
          // PDF coordinate system has origin at BOTTOM-LEFT with Y increasing upward
          // API coordinates have origin at TOP-LEFT with Y increasing downward
          // We need to flip the Y coordinates
          const y0_normalized = box.y1 / 1000;
          const y1_normalized = box.y2 / 1000;
          
          // Convert from top-left origin to bottom-left origin
          const y0 = DEFAULT_PAGE_HEIGHT - (y1_normalized * DEFAULT_PAGE_HEIGHT);
          const y1 = DEFAULT_PAGE_HEIGHT - (y0_normalized * DEFAULT_PAGE_HEIGHT);
          
          // rect format: [x0, y0, x1, y1]
          const rect = [x0, y0, x1, y1];
          
          console.log(`[PdfViewerService] Adding annotation at [${x0.toFixed(2)}, ${y0.toFixed(2)}, ${x1.toFixed(2)}, ${y1.toFixed(2)}]`);
          
          // Add square annotation with yellow fill and minimal border
          factory.createSquareAnnotation({
            page: pageIdx,
            rect: rect,
            contents: '',
            author: '',
            color: { r: 255, g: 255, b: 0 },
            fill: { r: 255, g: 255, b: 0 },
            opacity: 0.3,
            border: {
              border_width: 0
            }
          });
        }
      }
      
      console.log('[PdfViewerService] Writing annotated PDF');
      const annotatedPdf = factory.write();
      return annotatedPdf;
    } catch (error) {
      console.error('[PdfViewerService] Error adding annotations:', error);
      throw error;
    }
  }

  /**
   * Get all pages that have highlights for a chunk
   */
  getPagesWithHighlights(boundingBoxes: PageBoundingBoxes): number[] {
    return Object.keys(boundingBoxes).map(Number).sort((a, b) => a - b);
  }
}
