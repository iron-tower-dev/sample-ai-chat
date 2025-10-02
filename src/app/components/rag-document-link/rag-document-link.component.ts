import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RAGDocument } from '../../models/chat.models';

@Component({
    selector: 'app-rag-document-link',
    imports: [CommonModule],
    template: `
    <div class="rag-document-link" 
         (mouseenter)="showPreview = true" 
         (mouseleave)="showPreview = false">
      <a href="#" 
         class="document-link"
         (click)="onClick($event)"
         [title]="document().title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14,2 14,8 20,8"></polyline>
        </svg>
        <span class="document-title">{{ document().title }}</span>
        @if (document().pageNumber) {
          <span class="page-number">p.{{ document().pageNumber }}</span>
        }
        @if (document().relevanceScore) {
          <span class="relevance-score">{{ formatRelevanceScore(document().relevanceScore) }}</span>
        }
      </a>
      
      @if (showPreview) {
        <div class="document-preview">
          <div class="preview-header">
            <h4>{{ document().title }}</h4>
            <div class="preview-meta">
              <span class="source">{{ document().source.name }}</span>
              @if (document().pageNumber) {
                <span class="page">Page {{ document().pageNumber }}</span>
              }
            </div>
          </div>
          <div class="preview-content">
            {{ document().content }}
          </div>
          <div class="preview-footer">
            <div class="metadata">
              @if (document().metadata.author) {
                <span class="author">By {{ document().metadata.author }}</span>
              }
              @if (document().metadata.category) {
                <span class="category">{{ document().metadata.category }}</span>
              }
              @if (document().metadata.dateAdded) {
                <span class="date">{{ formatDate(document().metadata.dateAdded) }}</span>
              }
            </div>
            @if (document().relevanceScore) {
              <div class="relevance">
                Relevance: {{ formatRelevanceScore(document().relevanceScore) }}
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
    styleUrls: ['./rag-document-link.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RAGDocumentLinkComponent {
    document = input.required<RAGDocument>();
    showPreview = false;

    onClick(event: Event): void {
        event.preventDefault();
        // TODO: Implement document opening/viewing functionality
        console.log('Opening document:', this.document().id);
    }

    formatRelevanceScore(score: number | undefined): string {
        if (!score) return 'N/A';
        return `${Math.round(score * 100)}%`;
    }

    formatDate(date: Date | undefined): string {
        if (!date) return 'Unknown';
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(date));
    }
}
