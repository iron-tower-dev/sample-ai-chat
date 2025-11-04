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
            
            if (markdownContent) {
                // First, replace inline source citations with document links
                let processedContent = markdownContent;
                if (docs && docs.length > 0) {
                    processedContent = this.sourceCitation.replaceSourceCitationsWithHTML(markdownContent, docs);
                }
                
                // Then render the markdown
                this.markdownRenderer.renderMarkdown(processedContent).then(rendered => {
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
