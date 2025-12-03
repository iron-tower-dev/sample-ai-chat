import { Component, signal, ChangeDetectionStrategy, inject, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DocumentCitationMetadata, ChunkMetadata } from '../../models/chat.models';
import { environment } from '../../../environments/environment';
import { PdfViewerService, PageBoundingBoxes } from '../../services/pdf-viewer.service';

@Component({
  selector: 'app-citation-preview-modal',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <div class="citation-preview-modal">
      <div class="modal-header">
        <h2 class="modal-title">{{ citationData.DocumentTitle || 'Document Preview' }}</h2>
        <button 
          mat-icon-button 
          (click)="closeModal()"
          class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="modal-body">
        <!-- PDF Viewer -->
        <div class="pdf-viewer">
          @if (isLoading()) {
            <div class="loading-state">
              <mat-icon>description</mat-icon>
              <p>Loading document...</p>
            </div>
          } @else if (errorMessage()) {
            <div class="error-state">
              <mat-icon>error</mat-icon>
              <p>{{ errorMessage() }}</p>
            </div>
          } @else {
            <div class="iframe-container">
              <iframe 
                #pdfIframe
                [src]="pdfUrl()"
                type="application/pdf"
                class="pdf-iframe">
              </iframe>
            </div>
          }
        </div>

        <!-- Sidebar with chunks and metadata -->
        <div class="sidebar">
          <div class="sidebar-section">
            <h3>Document Chunks</h3>
            <div class="chunks-list">
              @for (chunk of citationData.Chunks; track chunk.chunk_id) {
                <button 
                  mat-button 
                  class="chunk-btn"
                  [class.active]="isChunkActive(chunk)"
                  [matTooltip]="'Relevance: ' + (chunk.relevance_score * 100).toFixed(1) + '%'"
                  (click)="navigateToChunk(chunk)">
                  <div class="chunk-info">
                    <span class="chunk-id">Chunk {{ chunk.chunk_id }}</span>
                    <span class="chunk-pages">Pages: {{ formatPages(chunk.pages) }}</span>
                    <span class="chunk-score">{{ (chunk.relevance_score * 100).toFixed(1) }}%</span>
                  </div>
                </button>
              }
            </div>
          </div>

          <div class="sidebar-section">
            <h3>Document Information</h3>
            <div class="metadata">
              <div class="metadata-item">
                <span class="metadata-label">Title:</span>
                <span class="metadata-value">{{ citationData.DocumentTitle }}</span>
              </div>
              @if (citationData.Revision !== 'N/A') {
                <div class="metadata-item">
                  <span class="metadata-label">Revision:</span>
                  <span class="metadata-value">{{ citationData.Revision }}</span>
                </div>
              }
              @if (citationData.SWMSTitle) {
                <div class="metadata-item">
                  <span class="metadata-label">SWMS Title:</span>
                  <span class="metadata-value">{{ citationData.SWMSTitle }}</span>
                </div>
              }
              @if (citationData.SWMSStatus) {
                <div class="metadata-item">
                  <span class="metadata-label">Status:</span>
                  <span class="metadata-value">{{ citationData.SWMSStatus }}</span>
                </div>
              }
              <div class="metadata-item">
                <span class="metadata-label">Category:</span>
                <span class="metadata-value">{{ citationData.Category }}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Document Type:</span>
                <span class="metadata-value">{{ citationData.DocType }}</span>
              </div>
            </div>

            <button 
              mat-raised-button 
              color="primary"
              (click)="openInNewTab()"
              class="open-external-btn">
              <mat-icon>open_in_new</mat-icon>
              Open in New Tab
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .citation-preview-modal {
      display: flex;
      flex-direction: column;
      width: 90vw;
      height: 85vh;
      max-width: 1400px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    }

    .modal-title {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
    }

    .close-btn {
      margin-left: 16px;
    }

    .modal-body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .pdf-viewer {
      flex: 2;
      display: flex;
      flex-direction: column;
      background: #f5f5f5;
      position: relative;
    }

    .pdf-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 12px;
      background: #ffffff;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    }

    .page-info {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.87);
      min-width: 100px;
      text-align: center;
    }

    .iframe-container {
      flex: 1;
      overflow: hidden;
      display: flex;
      width: 100%;
      height: 100%;
    }

    .pdf-iframe {
      width: 100%;
      height: 100%;
      border: none;
      background: white;
    }

    .loading-state,
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: rgba(0, 0, 0, 0.54);
    }

    .error-state {
      color: #d32f2f;
    }

    .loading-state mat-icon,
    .error-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
    }

    .sidebar {
      flex: 1;
      min-width: 300px;
      max-width: 400px;
      padding: 20px;
      overflow-y: auto;
      background: #ffffff;
      border-left: 1px solid rgba(0, 0, 0, 0.12);
    }

    .sidebar-section {
      margin-bottom: 32px;
    }

    .sidebar-section h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.87);
    }

    .chunks-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .chunk-btn {
      width: 100%;
      padding: 12px;
      text-align: left;
      background: #f5f5f5;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 6px;
      transition: background 0.2s;
    }

    .chunk-btn:hover {
      background: #e3f2fd;
    }

    .chunk-btn.active {
      background: #1976d2;
      border-color: #1565c0;
    }

    .chunk-btn.active .chunk-id,
    .chunk-btn.active .chunk-pages {
      color: white;
    }

    .chunk-btn.active .chunk-score {
      color: #ffd700;
    }

    .chunk-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .chunk-id {
      font-weight: 500;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.87);
    }

    .chunk-pages {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
    }

    .chunk-score {
      font-size: 12px;
      color: #1976d2;
      font-weight: 500;
    }

    .metadata {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .metadata-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .metadata-label {
      font-size: 12px;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.6);
      text-transform: uppercase;
    }

    .metadata-value {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.87);
      word-break: break-word;
    }

    .open-external-btn {
      width: 100%;
      margin-top: 16px;
    }

    /* Dark theme support */
    :host-context(.dark-theme) .modal-header {
      border-bottom-color: rgba(255, 255, 255, 0.12);
    }

    :host-context(.dark-theme) .modal-title {
      color: rgba(255, 255, 255, 0.87);
    }

    :host-context(.dark-theme) .pdf-viewer {
      background: #2c2c2c;
    }

    :host-context(.dark-theme) .loading-state {
      color: rgba(255, 255, 255, 0.54);
    }

    :host-context(.dark-theme) .sidebar {
      background: #1e1e1e;
      border-left-color: rgba(255, 255, 255, 0.12);
    }

    :host-context(.dark-theme) .metadata-value {
      color: rgba(255, 255, 255, 0.87);
    }

    :host-context(.dark-theme) .pdf-controls {
      background: #1e1e1e;
      border-bottom-color: rgba(255, 255, 255, 0.12);
    }

    :host-context(.dark-theme) .page-info {
      color: rgba(255, 255, 255, 0.87);
    }

    :host-context(.dark-theme) .error-state {
      color: #ef5350;
    }

    :host-context(.dark-theme) .chunk-btn.active {
      background: #1976d2;
      border-color: #1565c0;
    }

    :host-context(.dark-theme) .chunk-btn {
      background: #2c2c2c;
      border-color: rgba(255, 255, 255, 0.12);
    }

    :host-context(.dark-theme) .chunk-btn:hover {
      background: #1e3a5f;
    }

    :host-context(.dark-theme) .chunk-id {
      color: rgba(255, 255, 255, 0.87);
    }

    :host-context(.dark-theme) .chunk-pages {
      color: rgba(255, 255, 255, 0.6);
    }

    :host-context(.dark-theme) .metadata-label {
      color: rgba(255, 255, 255, 0.6);
    }

    :host-context(.dark-theme) .metadata-value {
      color: rgba(255, 255, 255, 0.87);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CitationPreviewModalComponent implements AfterViewInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<CitationPreviewModalComponent>);
  private pdfViewerService = inject(PdfViewerService);
  private sanitizer = inject(DomSanitizer);
  
  citationData: DocumentCitationMetadata = inject(MAT_DIALOG_DATA);

  @ViewChild('pdfIframe') pdfIframe!: ElementRef<HTMLIFrameElement>;

  // State signals
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  pdfUrl = signal<SafeResourceUrl | null>(null);
  
  // PDF document and data
  private annotatedBlobUrl: string | null = null;
  private currentChunk = signal<ChunkMetadata | null>(null);
  private allHighlights: Map<number, PageBoundingBoxes> = new Map();

  constructor() {
    // Initialize by loading the PDF
    if (this.citationData) {
      this.loadPdfDocument();
    }
  }

  ngAfterViewInit(): void {
    // PDF is loaded via iframe automatically
  }

  ngOnDestroy(): void {
    // Clean up blob URL
    if (this.annotatedBlobUrl) {
      URL.revokeObjectURL(this.annotatedBlobUrl);
    }
  }
  
  private async loadPdfDocument(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      const url = this.buildPdfUrl(this.citationData);
      console.log('[CitationPreviewModal] Fetching PDF from:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const pdfData = new Uint8Array(arrayBuffer);
      console.log('[CitationPreviewModal] PDF received, size:', pdfData.length);
      
      // Parse all chunk highlights
      this.parseChunkHighlights();
      
      // Combine all highlights from all chunks
      const allBoundingBoxes: PageBoundingBoxes = {};
      this.allHighlights.forEach(pageBboxes => {
        for (const [pageNum, boxes] of Object.entries(pageBboxes)) {
          if (!allBoundingBoxes[pageNum]) {
            allBoundingBoxes[pageNum] = [];
          }
          allBoundingBoxes[pageNum].push(...boxes);
        }
      });
      
      console.log('[CitationPreviewModal] Adding annotations to PDF');
      
      // Add annotations to the PDF
      const annotatedPdf = await this.pdfViewerService.addAnnotationsToPdf(
        pdfData,
        allBoundingBoxes
      );
      
      // Create blob URL for the annotated PDF
      const blob = new Blob([annotatedPdf as unknown as BlobPart], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      this.annotatedBlobUrl = blobUrl;
      
      // Sanitize the URL for iframe
      this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl));
      
      console.log('[CitationPreviewModal] PDF loaded and annotated successfully');
      
      this.isLoading.set(false);
    } catch (error) {
      console.error('[CitationPreviewModal] Error loading PDF:', error);
      this.errorMessage.set('Failed to load PDF document');
      this.isLoading.set(false);
    }
  }

  private parseChunkHighlights(): void {
    this.citationData.Chunks.forEach((chunk, index) => {
      if (chunk.bounding_boxes) {
        const parsed = this.pdfViewerService.parseBoundingBoxes(chunk.bounding_boxes);
        this.allHighlights.set(index, parsed);
      }
    });
  }

  private buildPdfUrl(data: DocumentCitationMetadata): string {
    const baseUrl = `${environment.apiUrl}/get_document`;
    const params = new URLSearchParams({
      filepath: data.PathName,
      filename: data.FileName
    });
    return `${baseUrl}?${params.toString()}`;
  }

  closeModal(): void {
    this.dialogRef.close();
  }

  navigateToChunk(chunk: ChunkMetadata): void {
    console.log('[CitationPreviewModal] Navigating to chunk:', chunk);
    
    // Set as current chunk
    this.currentChunk.set(chunk);
    
    // Navigate to first page of chunk
    if (chunk.pages && chunk.pages.length > 0) {
      const firstPage = Math.min(...chunk.pages);
      console.log('[CitationPreviewModal] Navigating to page:', firstPage);
      
      // Note: PDF page numbering in URL fragments typically starts at 1
      const targetPage = firstPage + 1;
      
      // Try to navigate the iframe directly
      if (this.pdfIframe?.nativeElement) {
        const iframe = this.pdfIframe.nativeElement;
        
        // Method 1: Use iframe's contentWindow to navigate
        try {
          if (iframe.contentWindow) {
            const newUrl = `${this.annotatedBlobUrl}#page=${targetPage}`;
            iframe.contentWindow.location.replace(newUrl);
            console.log('[CitationPreviewModal] Navigated iframe to page:', targetPage);
          }
        } catch (error) {
          // If direct navigation fails, update the src attribute
          console.log('[CitationPreviewModal] Direct navigation failed, updating src');
          if (this.annotatedBlobUrl) {
            const urlWithPage = `${this.annotatedBlobUrl}#page=${targetPage}`;
            const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(urlWithPage);
            this.pdfUrl.set(safeUrl);
          }
        }
      } else {
        console.warn('[CitationPreviewModal] iframe not available yet');
      }
    }
  }

  isChunkActive(chunk: ChunkMetadata): boolean {
    return this.currentChunk() === chunk;
  }

  openInNewTab(): void {
    if (this.annotatedBlobUrl) {
      console.log('[CitationPreviewModal] Opening annotated PDF in new tab');
      window.open(this.annotatedBlobUrl, '_blank');
    }
  }

  formatPages(pages: number[]): string {
    if (!pages || pages.length === 0) return 'N/A';
    if (pages.length === 1) return pages[0].toString();
    return `${pages[0]}-${pages[pages.length - 1]}`;
  }
}
