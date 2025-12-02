import { Component, input, signal, effect, ChangeDetectionStrategy, inject, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { MarkdownRendererService } from '../../services/markdown-renderer.service';
import { SourceCitationService } from '../../services/source-citation.service';
import { RAGDocument } from '../../models/chat.models';
import { CitationPreviewModalComponent } from '../citation-preview-modal/citation-preview-modal.component';

@Component({
    selector: 'app-markdown-content',
    imports: [CommonModule],
    template: `
    <div 
      class="markdown-content"
      [innerHTML]="renderedContent()"
      [class.has-math]="containsMath()">
    </div>
  `,
    styleUrls: ['./markdown-content.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarkdownContentComponent implements AfterViewChecked {
    private markdownRenderer = inject(MarkdownRendererService);
    private sanitizer = inject(DomSanitizer);
    private sourceCitation = inject(SourceCitationService);
    private dialog = inject(MatDialog);
    private elementRef = inject(ElementRef);
    
    private clickHandlersAttached = false;

    content = input.required<string>();
    ragDocuments = input<RAGDocument[]>([]);
    citationMetadata = input<Record<string, any>>();

    renderedContent = signal<SafeHtml>('');
    containsMath = signal<boolean>(false);

    constructor() {
        effect(() => {
            const markdownContent = this.content();
            const docs = this.ragDocuments();
            const metadata = this.citationMetadata();
            
            console.log('[MarkdownContent] Content changed:', markdownContent?.substring(0, 100));
            console.log('[MarkdownContent] RAG docs:', docs?.length || 0);
            console.log('[MarkdownContent] Citation metadata:', metadata);
            console.log('[MarkdownContent] Citation metadata keys:', metadata ? Object.keys(metadata).length : 0);
            
            if (markdownContent) {
                // First, replace inline source citations with document links
                let processedContent = markdownContent;
                if ((docs && docs.length > 0) || metadata) {
                    console.log('[MarkdownContent] Processing citations...');
                    processedContent = this.sourceCitation.replaceSourceCitationsWithHTML(markdownContent, docs, metadata);
                    console.log('[MarkdownContent] After citation processing:', processedContent.substring(0, 200));
                }
                
                // Then render the markdown
                this.markdownRenderer.renderMarkdown(processedContent).then(rendered => {
                    console.log('[MarkdownContent] After markdown render:', rendered.substring(0, 200));
                    // Use DomSanitizer to bypass Angular's sanitization since we already sanitized with DOMPurify
                    const safeHtml = this.sanitizer.bypassSecurityTrustHtml(rendered);
                    this.renderedContent.set(safeHtml);
                    // Mark that click handlers need to be reattached
                    this.clickHandlersAttached = false;
                });
                this.containsMath.set(this.markdownRenderer.containsMath(markdownContent));
            } else {
                this.renderedContent.set(this.sanitizer.bypassSecurityTrustHtml(''));
                this.containsMath.set(false);
            }
        });
    }
    
    ngAfterViewChecked(): void {
        // Attach click handlers to citation links after the view has been updated
        if (!this.clickHandlersAttached) {
            this.attachCitationClickHandlers();
            this.clickHandlersAttached = true;
        }
    }
    
    private attachCitationClickHandlers(): void {
        const element = this.elementRef.nativeElement as HTMLElement;
        const citationLinks = element.querySelectorAll('.inline-source-citation');
        
        console.log('[MarkdownContent] Found', citationLinks.length, 'citation links to attach handlers to');
        
        citationLinks.forEach((link) => {
            // Remove any existing click handlers to avoid duplicates
            const newLink = link.cloneNode(true) as HTMLElement;
            link.parentNode?.replaceChild(newLink, link);
            
            newLink.addEventListener('click', (event: Event) => {
                event.preventDefault();
                
                const docDataAttr = newLink.getAttribute('data-doc');
                const uuidAttr = newLink.getAttribute('data-uuid');
                const externalUrl = newLink.getAttribute('href');
                
                // If there's an external eDoc URL, open PDF popup
                if (externalUrl && externalUrl.includes('/edoc?edocid=')) {
                    console.log('[MarkdownContent] Opening PDF popup for:', externalUrl);
                    this.openPdfPopup(externalUrl, docDataAttr);
                    return;
                }
                
                // Otherwise, open the modal (for preview-only citations)
                if (docDataAttr) {
                    try {
                        const docData = JSON.parse(decodeURIComponent(docDataAttr));
                        console.log('[MarkdownContent] Citation clicked:', docData);
                        
                        // Check if this is a UUID-based citation
                        if (uuidAttr && docData.metadata) {
                            // Use the metadata directly
                            this.openCitationPreviewFromMetadata(docData.metadata);
                        } else {
                            // Find the full document from ragDocuments
                            const docs = this.ragDocuments();
                            const fullDoc = docs.find(d => d.id === docData.id);
                            
                            if (fullDoc) {
                                this.openCitationPreview(fullDoc);
                            } else {
                                console.warn('[MarkdownContent] Document not found for citation:', docData);
                            }
                        }
                    } catch (e) {
                        console.error('[MarkdownContent] Error parsing citation data:', e);
                    }
                }
            });
        });
    }
    
    private openCitationPreviewFromMetadata(metadata: any): void {
        console.log('[MarkdownContent] Opening citation preview from metadata:', metadata);
        
        // The metadata should already be in DocumentCitationMetadata format
        if (metadata.DocumentTitle) {
            this.dialog.open(CitationPreviewModalComponent, {
                data: metadata,
                width: '90vw',
                height: '85vh',
                maxWidth: '1400px',
                disableClose: false,
                panelClass: 'citation-preview-dialog'
            });
        } else {
            // Fallback to simple display
            const info = [
                `Document: ${metadata.DocumentTitle || 'Unknown'}`,
                `Category: ${metadata.Category || 'Unknown'}`,
                `Doc Type: ${metadata.DocType || 'Unknown'}`
            ];
            alert(info.join('\n\n'));
        }
    }
    
    private openPdfPopup(edocUrl: string, docDataAttr: string | null): void {
        console.log('[MarkdownContent] Opening PDF popup window');
        
        // Parse document metadata if available
        let docMetadata: any = null;
        if (docDataAttr) {
            try {
                const docData = JSON.parse(decodeURIComponent(docDataAttr));
                docMetadata = docData.metadata || {};
            } catch (e) {
                console.error('[MarkdownContent] Error parsing doc data:', e);
            }
        }
        
        // Create popup window
        const popupWidth = 1200;
        const popupHeight = 800;
        const left = (window.screen.width - popupWidth) / 2;
        const top = (window.screen.height - popupHeight) / 2;
        
        const popup = window.open(
            '',
            'PDFViewer',
            `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );
        
        if (!popup) {
            console.error('[MarkdownContent] Failed to open popup window (blocked by browser?)');
            alert('Please allow popups for this site to view documents.');
            return;
        }
        
        // Write the HTML structure to the popup
        popup.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${docMetadata?.DocumentTitle || 'Document Viewer'}</title>
<style>
  body {
    margin: 0;
    font-family: Arial, sans-serif;
    background: #eef1f5;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
  #top-header {
    height: 55px;
    background: #1b3455;
    color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    font-size: 18px;
    font-weight: bold;
    box-sizing: border-box;
  }
  #close-btn {
    background: #ffffff;
    color: #1b3455;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  }
  #close-btn:hover {
    background: #e0e0e0;
  }
  #content-wrapper {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  #pdf-viewer {
    flex: 2;
    background: #f0f2f5;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  #pdf-frame {
    width: 100%;
    height: 100%;
    border: none;
  }
  #loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 18px;
    color: #666;
  }
  #sidebar {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    background: #ffffff;
    border-left: 1px solid #ddd;
    min-width: 300px;
  }
  #sidebar h3 {
    margin-top: 0;
    color: #1b3455;
  }
  .metadata-item {
    margin-bottom: 12px;
    padding: 8px;
    background: #f5f5f5;
    border-radius: 4px;
  }
  .metadata-item strong {
    display: block;
    color: #1b3455;
    margin-bottom: 4px;
  }
</style>
</head>
<body>
  <div id="top-header">
    <span>Document Viewer - ${docMetadata?.DocumentTitle || 'PDF'}</span>
    <button id="close-btn" onclick="window.close()">Close</button>
  </div>
  <div id="content-wrapper">
    <div id="pdf-viewer">
      <div id="loading">Loading PDF...</div>
      <iframe id="pdf-frame" style="display:none;"></iframe>
    </div>
    <div id="sidebar">
      <h3>Document Information</h3>
      <div id="metadata"></div>
    </div>
  </div>
  <script>
    const edocUrl = ${JSON.stringify(edocUrl)};
    const metadata = ${JSON.stringify(docMetadata || {})};
    
    // Populate metadata sidebar
    const metadataDiv = document.getElementById('metadata');
    if (metadata && Object.keys(metadata).length > 0) {
      let html = '';
      if (metadata.DocumentTitle) {
        html += \`<div class="metadata-item"><strong>Title:</strong> \${metadata.DocumentTitle}</div>\`;
      }
      if (metadata.Revision) {
        html += \`<div class="metadata-item"><strong>Revision:</strong> \${metadata.Revision}</div>\`;
      }
      if (metadata.SWMSTitle) {
        html += \`<div class="metadata-item"><strong>SWMS Title:</strong> \${metadata.SWMSTitle}</div>\`;
      }
      if (metadata.SWMSStatus) {
        html += \`<div class="metadata-item"><strong>SWMS Status:</strong> \${metadata.SWMSStatus}</div>\`;
      }
      if (metadata.Category) {
        html += \`<div class="metadata-item"><strong>Category:</strong> \${metadata.Category}</div>\`;
      }
      if (metadata.DocType) {
        html += \`<div class="metadata-item"><strong>Document Type:</strong> \${metadata.DocType}</div>\`;
      }
      if (metadata.eDocID) {
        html += \`<div class="metadata-item"><strong>eDoc ID:</strong> \${metadata.eDocID}</div>\`;
      }
      metadataDiv.innerHTML = html;
    } else {
      metadataDiv.innerHTML = '<p>No metadata available</p>';
    }
    
    // Load the PDF
    async function loadPdf() {
      try {
        console.log('Fetching PDF from:', edocUrl);
        const response = await fetch(edocUrl);
        if (!response.ok) throw new Error('Failed to fetch PDF: ' + response.status);
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const frame = document.getElementById('pdf-frame');
        frame.src = blobUrl;
        frame.style.display = 'block';
        
        document.getElementById('loading').style.display = 'none';
      } catch (err) {
        console.error('Error loading PDF:', err);
        document.getElementById('loading').textContent = 'Error loading PDF: ' + err.message;
      }
    }
    
    loadPdf();
  </script>
</body>
</html>
        `);
        popup.document.close();
    }
    
    private openCitationPreview(document: RAGDocument): void {
        console.log('[MarkdownContent] Opening citation preview for document:', document);
        
        // Check if we have the necessary metadata for CitationPreviewModalComponent
        const metadata = document.metadata as any;
        
        // If document has eDoc-style metadata with required fields, use the full modal
        if (metadata?.eDocID || metadata?.edocid || metadata?.PathName) {
            const citationData = {
                DocumentTitle: document.title,
                eDocID: metadata.eDocID || metadata.edocid || metadata.edocID || null,
                Revision: metadata.Revision || 'N/A',
                PathName: metadata.PathName || '',
                FileName: metadata.FileName || metadata.documentName || '',
                SWMSStatus: metadata.SWMSStatus || '',
                SWMSTitle: metadata.SWMSTitle || '',
                Category: metadata.category || metadata.Category || 'Unknown',
                DocType: metadata.DocType || 'Document',
                Chunks: [] // No chunk data available from RAGDocument
            };
            
            this.dialog.open(CitationPreviewModalComponent, {
                data: citationData,
                width: '90vw',
                height: '85vh',
                maxWidth: '1400px',
                disableClose: false,
                panelClass: 'citation-preview-dialog'
            });
        } else {
            // For other document types, show a simple info display
            // TODO: Create a generic document info component
            const info = [
                `Document: ${document.title}`,
                `Source: ${document.source?.name || 'Unknown'}`,
                `Relevance: ${document.relevanceScore ? (document.relevanceScore * 100).toFixed(1) + '%' : 'N/A'}`
            ];
            
            if (document.metadata?.author) {
                info.push(`Author: ${document.metadata.author}`);
            }
            if (document.metadata?.category) {
                info.push(`Category: ${document.metadata.category}`);
            }
            if (document.pageNumber) {
                info.push(`Page: ${document.pageNumber}`);
            }
            
            alert(info.join('\n\n'));
        }
    }
}
