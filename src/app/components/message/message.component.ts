import { Component, input, output, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { ChatMessage, MessageFeedback } from '../../models/chat.models';
import { MarkdownContentComponent } from '../markdown-content/markdown-content.component';
import { FeedbackDialogComponent, FeedbackDialogData, FeedbackDialogResult } from '../feedback-dialog/feedback-dialog.component';
import { ThinkingSectionComponent } from '../thinking-section/thinking-section.component';

@Component({
  selector: 'app-message',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MarkdownContentComponent,
    ThinkingSectionComponent
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
        </div>
      </div>
      
      <div class="message-content">
        @if (message().role === 'assistant') {
          @if (isLoading() && !message().content) {
            <div class="thinking-indicator">
              <mat-spinner diameter="20"></mat-spinner>
              <span>{{ message().toolingText || 'Generating response...' }}</span>
            </div>
          } @else {
            <!-- Thinking section -->
            @if (message().thinkingText || message().toolingText) {
              <app-thinking-section
                [thinkingText]="message().thinkingText || ''"
                [toolingText]="message().toolingText || ''">
              </app-thinking-section>
            }
            
            <!-- Response content with inline citations -->
            <div class="response-content">
              <app-markdown-content 
                [content]="processedContent()"
                [ragDocuments]="message().ragDocuments || []"
                [citationMetadata]="message().citationMetadata"></app-markdown-content>
            </div>
          }
        } @else {
          <div class="content-text">{{ message().content }}</div>
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
  isLoading = input<boolean>(false);
  feedbackSubmitted = output<{ messageId: string; type: 'positive' | 'negative'; comment?: string }>();

  pendingFeedback = input<'positive' | 'negative' | null>(null);

  // Use computed signal to pass content directly
  processedContent = signal('');

  constructor() {
    // Update processed content whenever message changes
    effect(() => {
      try {
        const msg = this.message();
        if (msg) {
          const content = msg.content || '';
          this.processedContent.set(content);
        }
      } catch (e) {
        console.error('[MessageComponent] Error in effect:', e);
      }
    });
  }

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
