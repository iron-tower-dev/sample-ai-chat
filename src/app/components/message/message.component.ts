import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage, MessageFeedback } from '../../models/chat.models';
import { RAGDocumentLinkComponent } from '../rag-document-link/rag-document-link.component';
import { MarkdownContentComponent } from '../markdown-content/markdown-content.component';

@Component({
  selector: 'app-message',
  imports: [CommonModule, RAGDocumentLinkComponent, MarkdownContentComponent],
  template: `
    <div class="message" [class.user-message]="message().role === 'user'" [class.assistant-message]="message().role === 'assistant'">
      <div class="message-header">
        <div class="message-role">
          @if (message().role === 'user') {
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>You</span>
          } @else {
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <path d="M9 9h6v6H9z"></path>
            </svg>
            <span>AI Assistant</span>
          }
        </div>
        <div class="message-meta">
          <span class="timestamp">{{ formatTimestamp(message().timestamp) }}</span>
          @if (message().model) {
            <span class="model">{{ message().model }}</span>
          }
        </div>
      </div>
      
      <div class="message-content">
        @if (message().role === 'assistant') {
          <app-markdown-content [content]="message().content"></app-markdown-content>
        } @else {
          <div class="content-text">{{ message().content }}</div>
        }
        
        @if (message().ragDocuments && message().ragDocuments!.length > 0) {
          <div class="rag-documents">
            <div class="rag-header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
              </svg>
              <span>Sources used:</span>
            </div>
            <div class="rag-links">
              @for (doc of message().ragDocuments; track doc.id) {
                <app-rag-document-link [document]="doc"></app-rag-document-link>
              }
            </div>
          </div>
        }
      </div>
      
      @if (message().role === 'assistant' && !message().feedback) {
        <div class="message-actions">
          <button 
            class="feedback-btn positive"
            (click)="submitFeedback('positive')"
            [class.active]="pendingFeedback() === 'positive'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 9V5a3 3 0 0 0-6 0v4"></path>
              <rect x="2" y="9" width="20" height="11" rx="2" ry="2"></rect>
            </svg>
            <span>Good</span>
          </button>
          <button 
            class="feedback-btn negative"
            (click)="submitFeedback('negative')"
            [class.active]="pendingFeedback() === 'negative'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 15v4a3 3 0 0 0 6 0v-4"></path>
              <rect x="2" y="9" width="20" height="11" rx="2" ry="2"></rect>
            </svg>
            <span>Poor</span>
          </button>
        </div>
      }
      
      @if (message().feedback) {
        <div class="feedback-submitted">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
          <span>Thank you for your feedback!</span>
        </div>
      }
    </div>
  `,
  styleUrls: ['./message.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageComponent {
  message = input.required<ChatMessage>();
  feedbackSubmitted = output<{ messageId: string; type: 'positive' | 'negative'; comment?: string }>();

  pendingFeedback = input<'positive' | 'negative' | null>(null);

  formatTimestamp(timestamp: Date | undefined): string {
    if (!timestamp) return 'Unknown';
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  }

  submitFeedback(type: 'positive' | 'negative'): void {
    this.feedbackSubmitted.emit({
      messageId: this.message().id,
      type,
      comment: undefined
    });
  }
}
