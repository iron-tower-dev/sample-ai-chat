import { Component, input, signal, effect, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MarkdownRendererService } from '../../services/markdown-renderer.service';
import { SourceCitationService } from '../../services/source-citation.service';
import { RAGDocument } from '../../models/chat.models';

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
export class MarkdownContentComponent {
    private markdownRenderer = inject(MarkdownRendererService);
    private sanitizer = inject(DomSanitizer);
    private sourceCitation = inject(SourceCitationService);

    content = input.required<string>();
    ragDocuments = input<RAGDocument[]>([]);

    renderedContent = signal<SafeHtml>('');
    containsMath = signal<boolean>(false);

    constructor() {
        effect(() => {
            const markdownContent = this.content();
            const docs = this.ragDocuments();
            
            console.log('[MarkdownContent] Content changed:', markdownContent?.substring(0, 100));
            console.log('[MarkdownContent] RAG docs:', docs?.length || 0);
            
            if (markdownContent) {
                // First, replace inline source citations with document links
                let processedContent = markdownContent;
                if (docs && docs.length > 0) {
                    console.log('[MarkdownContent] Processing citations...');
                    processedContent = this.sourceCitation.replaceSourceCitationsWithHTML(markdownContent, docs);
                    console.log('[MarkdownContent] After citation processing:', processedContent.substring(0, 200));
                }
                
                // Then render the markdown
                this.markdownRenderer.renderMarkdown(processedContent).then(rendered => {
                    console.log('[MarkdownContent] After markdown render:', rendered.substring(0, 200));
                    // Use DomSanitizer to bypass Angular's sanitization since we already sanitized with DOMPurify
                    const safeHtml = this.sanitizer.bypassSecurityTrustHtml(rendered);
                    this.renderedContent.set(safeHtml);
                });
                this.containsMath.set(this.markdownRenderer.containsMath(markdownContent));
            } else {
                this.renderedContent.set(this.sanitizer.bypassSecurityTrustHtml(''));
                this.containsMath.set(false);
            }
        });
    }
}
