import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DocumentCitationMetadata } from '../../models/chat.models';
import { environment } from '../../../environments/environment';

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
          @if (pdfUrl()) {
            <iframe 
              [src]="pdfUrl()" 
              class="pdf-frame"
              title="PDF Document Preview">
            </iframe>
          } @else {
            <div class="loading-state">
              <mat-icon>description</mat-icon>
              <p>Loading document...</p>
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
                  [matTooltip]="'Relevance: ' + (chunk.relevance_score * 100).toFixed(1) + '%'">
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

    .pdf-frame {
      width: 100%;
      height: 100%;
      border: none;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: rgba(0, 0, 0, 0.54);
    }

    .loading-state mat-icon {
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

    :host-context(.dark-theme) .sidebar-section h3 {
      color: rgba(255, 255, 255, 0.87);
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
export class CitationPreviewModalComponent {
  private sanitizer = inject(DomSanitizer);
  private dialogRef = inject(MatDialogRef<CitationPreviewModalComponent>);
  
  citationData: DocumentCitationMetadata = inject(MAT_DIALOG_DATA);

  pdfUrl = signal<SafeResourceUrl | null>(null);

  constructor() {
    // Fetch PDF as blob when component initializes
    if (this.citationData) {
      this.loadPdfAsBlob();
    }
  }
  
  private async loadPdfAsBlob(): Promise<void> {
    try {
      const url = this.buildPdfUrl(this.citationData);
      console.log('[CitationPreviewModal] Fetching PDF from:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('[CitationPreviewModal] PDF blob received, size:', blob.size);
      
      // Create a blob URL and set it as the iframe source
      const blobUrl = URL.createObjectURL(blob);
      this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl));
      
      console.log('[CitationPreviewModal] PDF blob URL created:', blobUrl);
    } catch (error) {
      console.error('[CitationPreviewModal] Error loading PDF:', error);
      // Keep pdfUrl as null to show loading/error state
    }
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

  async openInNewTab(): Promise<void> {
    if (this.citationData) {
      // Check if we already have a blob URL
      const currentUrl = this.pdfUrl();
      if (currentUrl) {
        // Extract the blob URL from the SafeResourceUrl
        const urlString = currentUrl.toString();
        // Open the existing blob URL
        window.open(urlString, '_blank');
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
