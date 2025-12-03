import { Component, signal, ChangeDetectionStrategy, inject, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DocumentCitationMetadata, ChunkMetadata } from '../../models/chat.models';
import { environment } from '../../../environments/environment';
import { PdfViewerService, PageBoundingBoxes } from '../../services/pdf-viewer.service';
import type { PDFDocumentProxy } from 'pdfjs-dist';

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
            <div class="pdf-controls">
              <button mat-icon-button (click)="previousPage()" [disabled]="currentPage() === 1">
                <mat-icon>chevron_left</mat-icon>
              </button>
              <span class="page-info">Page {{ currentPage() }} of {{ totalPages() }}</span>
              <button mat-icon-button (click)="nextPage()" [disabled]="currentPage() === totalPages()">
                <mat-icon>chevron_right</mat-icon>
              </button>
            </div>
            <div class="canvas-container">
              <canvas #pdfCanvas></canvas>
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

    .canvas-container {
      flex: 1;
      overflow: auto;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 20px;
    }

    .canvas-container canvas {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
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
  `,
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
  
  citationData: DocumentCitationMetadata = inject(MAT_DIALOG_DATA);

  @ViewChild('pdfCanvas') pdfCanvas!: ElementRef<HTMLCanvasElement>;

  // State signals
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  currentPage = signal(1);
  totalPages = signal(1);
  
  // PDF document and data
  private pdfDocument: PDFDocumentProxy | null = null;
  private rawBlobUrl: string | null = null;
  private currentChunk = signal<ChunkMetadata | null>(null);
  private allHighlights: Map<number, PageBoundingBoxes> = new Map();

  constructor() {
    // Initialize by loading the PDF
    if (this.citationData) {
      this.loadPdfDocument();
    }
  }

  ngAfterViewInit(): void {
    // Render initial page if PDF is already loaded
    if (this.pdfDocument && this.pdfCanvas) {
      this.renderCurrentPage();
    }
  }

  ngOnDestroy(): void {
    // Clean up blob URL
    if (this.rawBlobUrl) {
      URL.revokeObjectURL(this.rawBlobUrl);
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
      
      const blob = await response.blob();
      console.log('[CitationPreviewModal] PDF blob received, size:', blob.size);
      
      // Create a blob URL
      const blobUrl = URL.createObjectURL(blob);
      this.rawBlobUrl = blobUrl;
      
      // Load PDF with PDF.js
      this.pdfDocument = await this.pdfViewerService.loadPdfDocument(blobUrl);
      this.totalPages.set(this.pdfDocument.numPages);
      
      // Parse all chunk highlights
      this.parseChunkHighlights();
      
      console.log('[CitationPreviewModal] PDF loaded successfully, pages:', this.pdfDocument.numPages);
      
      this.isLoading.set(false);
      
      // Render first page after view is initialized
      if (this.pdfCanvas) {
        await this.renderCurrentPage();
      }
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

  private async renderCurrentPage(): Promise<void> {
    if (!this.pdfDocument || !this.pdfCanvas) {
      return;
    }

    const canvas = this.pdfCanvas.nativeElement;
    const pageNum = this.currentPage();
    
    // Get highlights for current page
    const highlights = this.getCurrentPageHighlights();
    
    try {
      await this.pdfViewerService.renderPageWithHighlights(
        this.pdfDocument,
        pageNum,
        canvas,
        highlights
      );
    } catch (error) {
      console.error('[CitationPreviewModal] Error rendering page:', error);
    }
  }

  private getCurrentPageHighlights() {
    const pageNum = this.currentPage().toString();
    const highlights = [];
    
    // Get highlights from current chunk if one is selected
    const chunk = this.currentChunk();
    if (chunk) {
      const chunkIndex = this.citationData.Chunks.indexOf(chunk);
      const chunkHighlights = this.allHighlights.get(chunkIndex);
      if (chunkHighlights && chunkHighlights[pageNum]) {
        highlights.push(...chunkHighlights[pageNum]);
      }
    } else {
      // Show all highlights on current page
      this.allHighlights.forEach(pageBboxes => {
        if (pageBboxes[pageNum]) {
          highlights.push(...pageBboxes[pageNum]);
        }
      });
    }
    
    return highlights;
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

  async previousPage(): Promise<void> {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      await this.renderCurrentPage();
    }
  }

  async nextPage(): Promise<void> {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      await this.renderCurrentPage();
    }
  }

  async navigateToChunk(chunk: ChunkMetadata): Promise<void> {
    // Set as current chunk
    this.currentChunk.set(chunk);
    
    // Navigate to first page of chunk
    if (chunk.pages && chunk.pages.length > 0) {
      const firstPage = Math.min(...chunk.pages);
      this.currentPage.set(firstPage);
      await this.renderCurrentPage();
    }
  }

  isChunkActive(chunk: ChunkMetadata): boolean {
    return this.currentChunk() === chunk;
  }

  async openInNewTab(): Promise<void> {
    if (this.citationData) {
      // Check if we already have a blob URL
      if (this.rawBlobUrl) {
        console.log('[CitationPreviewModal] Opening existing blob URL in new tab:', this.rawBlobUrl);
        window.open(this.rawBlobUrl, '_blank');
      } else {
        // Fetch and create a new blob URL
        try {
          const url = this.buildPdfUrl(this.citationData);
          console.log('[CitationPreviewModal] Fetching PDF for new tab:', url);
          
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch PDF: ${response.status}`);
          }
          
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          console.log('[CitationPreviewModal] Opening new blob URL in new tab:', blobUrl);
          window.open(blobUrl, '_blank');
        } catch (error) {
          console.error('[CitationPreviewModal] Error opening PDF in new tab:', error);
          alert('Failed to open PDF in new tab');
        }
      }
    }
  }

  formatPages(pages: number[]): string {
    if (!pages || pages.length === 0) return 'N/A';
    if (pages.length === 1) return pages[0].toString();
    return `${pages[0]}-${pages[pages.length - 1]}`;
  }
}
