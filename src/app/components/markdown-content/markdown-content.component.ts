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
            // Use setTimeout to ensure DOM is fully updated
            setTimeout(() => {
                this.attachCitationClickHandlers();
            }, 0);
            this.clickHandlersAttached = true;
        }
    }
    
    private attachCitationClickHandlers(): void {
        const element = this.elementRef.nativeElement as HTMLElement;
        const citationLinks = element.querySelectorAll('.inline-source-citation');
        
        console.log('[MarkdownContent] Attaching handlers to', citationLinks.length, 'citation links');
        
        citationLinks.forEach((link, index) => {
            console.log(`[MarkdownContent] Link ${index}:`, link.getAttribute('href'), 'class:', link.className);
            
            // Remove any existing click handlers to avoid duplicates
            const newLink = link.cloneNode(true) as HTMLElement;
            link.parentNode?.replaceChild(newLink, link);
            
            newLink.addEventListener('click', (event: Event) => {
                console.log('[MarkdownContent] *** CLICK HANDLER FIRED ***');
                event.preventDefault();
                event.stopPropagation();
                
                const docDataAttr = newLink.getAttribute('data-doc');
                const uuidAttr = newLink.getAttribute('data-uuid');
                const externalUrl = newLink.getAttribute('href');
                
                console.log('[MarkdownContent] Citation clicked, href:', externalUrl);
                
                // If there's an external document URL (not javascript:void(0)), open PDF popup
                if (externalUrl && externalUrl !== 'javascript:void(0)' && externalUrl !== '#') {
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
        console.log('[MarkdownContent] Opening PDF in modal');
        
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
        
        // Ensure we have the required PathName and FileName for the modal
        if (!docMetadata || !docMetadata.PathName || !docMetadata.FileName) {
            console.error('[MarkdownContent] Missing PathName or FileName in metadata');
            alert('Cannot open document: Missing required metadata');
            return;
        }
        
        // Open the citation preview modal with the metadata
        // The modal expects DocumentCitationMetadata format
        const citationData = {
            DocumentTitle: docMetadata.DocumentTitle || 'Unknown Document',
            eDocID: docMetadata.eDocID || docMetadata.edocID || null,
            Revision: docMetadata.Revision || 'N/A',
            PathName: docMetadata.PathName,
            FileName: docMetadata.FileName,
            SWMSStatus: docMetadata.SWMSStatus || '',
            SWMSTitle: docMetadata.SWMSTitle || '',
            Category: docMetadata.Category || 'Unknown',
            DocType: docMetadata.DocType || 'Document',
            Chunks: docMetadata.Chunks || [] // Empty array if no chunks
        };
        
        console.log('[MarkdownContent] Opening modal with citation data:', citationData);
        
        this.dialog.open(CitationPreviewModalComponent, {
            data: citationData,
            width: '90vw',
            height: '85vh',
            maxWidth: '1400px',
            disableClose: false,
            panelClass: 'citation-preview-dialog'
        });
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
