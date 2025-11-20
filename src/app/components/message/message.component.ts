import { Component, input, output, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { ChatMessage, MessageFeedback, DocumentCitationMetadata } from '../../models/chat.models';
import { MarkdownContentComponent } from '../markdown-content/markdown-content.component';
import { FeedbackDialogComponent, FeedbackDialogData, FeedbackDialogResult } from '../feedback-dialog/feedback-dialog.component';
import { ThinkingSectionComponent } from '../thinking-section/thinking-section.component';
import { CitationPreviewModalComponent } from '../citation-preview-modal/citation-preview-modal.component';

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
              <span>Generating response...</span>
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

  // Process content to add citation links
  processedContent = signal('');
  selectedCitation = signal<DocumentCitationMetadata | null>(null);
  showCitationModal = signal(false);

  constructor() {
    // Watch for changes to message content and add citation click handlers
    effect(() => {
      try {
        const msg = this.message();
        if (msg) {
          const content = msg.content || '';
          console.log('[MessageComponent] Content updated:', content.substring(0, 100), 'length:', content.length);
          const processed = this.addCitationHandlers(content);
          console.log('[MessageComponent] Processed content:', processed.substring(0, 100));
          this.processedContent.set(processed);
          console.log('[MessageComponent] processedContent signal set');
        }
      } catch (e) {
        console.error('[MessageComponent] Error in effect:', e);
        // Input signal not initialized yet, will run again when it is
      }
    });

    // Listen for citation click events
    window.addEventListener('citation-click', ((event: CustomEvent) => {
      this.handleCitationClick(event.detail);
    }) as EventListener);
  }

  private addCitationHandlers(content: string): string {
    // Replace citation patterns like [Source: {UUID}] with clickable links
    return content.replace(/\[Source: (\{[^}]+\})\]/g, (match, sourceId) => {
      const shortId = sourceId.substring(1, 15);
      return `<a href="#" class="citation-link" data-source-id="${sourceId}" onclick="event.preventDefault(); window.dispatchEvent(new CustomEvent('citation-click', { detail: '${sourceId}' }))">[Source: ${shortId}...]</a>`;
    });
  }

  private handleCitationClick(sourceId: string): void {
    const metadata = this.message().citationMetadata;
    if (metadata && metadata[sourceId]) {
      this.openCitationModal(metadata[sourceId]);
    }
  }

  private openCitationModal(citation: DocumentCitationMetadata): void {
    const dialogRef = this.dialog.open(CitationPreviewModalComponent, {
      data: citation,
      width: '90vw',
      height: '85vh',
      maxWidth: '1400px',
      disableClose: false,
      panelClass: 'citation-preview-dialog'
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
