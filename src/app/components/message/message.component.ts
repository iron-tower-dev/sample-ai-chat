import { Component, input, output, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { ChatMessage, MessageFeedback } from '../../models/chat.models';
import { RAGDocumentLinkComponent } from '../rag-document-link/rag-document-link.component';
import { MarkdownContentComponent } from '../markdown-content/markdown-content.component';
import { FeedbackDialogComponent, FeedbackDialogData, FeedbackDialogResult } from '../feedback-dialog/feedback-dialog.component';

@Component({
  selector: 'app-message',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    RAGDocumentLinkComponent,
    MarkdownContentComponent
  ],
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
            (click)="submitFeedback('positive')"
            [class.active]="pendingFeedback() === 'positive'"
            matTooltip="Good response"
            class="feedback-btn">
            <mat-icon>thumb_up_outline</mat-icon>
          </button>
          <button 
            (click)="submitFeedback('negative')"
            [class.active]="pendingFeedback() === 'negative'"
            matTooltip="Poor response"
            class="feedback-btn">
            <mat-icon>thumb_down_outline</mat-icon>
          </button>
        </div>
      }
      
      @if (message().feedback) {
        <div class="feedback-submitted" [class.positive]="message().feedback!.type === 'positive'" [class.negative]="message().feedback!.type === 'negative'">
          <mat-icon>{{ message().feedback!.type === 'positive' ? 'thumb_up' : 'thumb_down' }}</mat-icon>
          <div class="feedback-text">
            <span class="feedback-message">
              {{ message().feedback!.type === 'positive' ? 'Thanks for the positive feedback!' : 'Thanks for the feedback!' }}
            </span>
            @if (message().feedback!.comment) {
              <span class="feedback-comment">"{{ message().feedback!.comment }}"</span>
            }
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./message.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageComponent {
  private dialog = inject(MatDialog);
  
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
    const dialogData: FeedbackDialogData = {
      messageId: this.message().id,
      type
    };

    const dialogRef = this.dialog.open(FeedbackDialogComponent, {
      data: dialogData,
      width: '500px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: true,
      restoreFocus: true
    });

    dialogRef.afterClosed().subscribe((result: FeedbackDialogResult | undefined) => {
      if (result) {
        this.feedbackSubmitted.emit({
          messageId: result.messageId,
          type: result.type,
          comment: result.comment
        });
      }
    });
  }
}
