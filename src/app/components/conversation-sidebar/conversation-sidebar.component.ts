import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ChatService } from '../../services/chat.service';
import { Conversation } from '../../models/chat.models';

@Component({
  selector: 'app-conversation-sidebar',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatListModule,
    MatTooltipModule,
    MatDividerModule,
    MatToolbarModule
  ],
  template: `
    <div class="conversation-sidebar">
      <div class="sidebar-header">
        <button 
          mat-raised-button 
          color="primary"
          (click)="createNewConversation()"
          class="new-conversation-btn">
          <mat-icon>add</mat-icon>
          New Conversation
        </button>
      </div>
      
      <div class="conversations-list">
        @if (conversations().length === 0) {
          <div class="empty-state">
            <mat-icon class="empty-icon">chat_bubble_outline</mat-icon>
            <p>No conversations yet</p>
            <span>Start a new conversation to begin</span>
          </div>
        } @else {
          <div class="conversations-container">
            @for (conversation of conversations(); track conversation.id) {
              <div 
                [class.active]="conversation.id === currentConversationId()"
                (click)="selectConversation(conversation.id)"
                class="conversation-item">
                <div class="conversation-content">
                  <div class="conversation-header">
                    <h3 class="conversation-title">{{ conversation.title }}</h3>
                    <button 
                      mat-icon-button
                      (click)="deleteConversation(conversation.id, $event)"
                      matTooltip="Delete conversation"
                      class="delete-btn">
                      <mat-icon>delete_outline</mat-icon>
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['./conversation-sidebar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConversationSidebarComponent {
  private chatService = inject(ChatService);

  isCollapsed = signal(false);

  // Computed signals
  readonly conversations = computed(() => {
    // Show most recent first (reverse chronological order)
    return [...this.chatService.conversations$()].sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  });
  readonly currentConversationId = this.chatService.currentConversationId$;

  createNewConversation(): void {
    this.chatService.createNewConversation();
  }

  selectConversation(conversationId: string): void {
    this.chatService.selectConversation(conversationId);
  }

  deleteConversation(conversationId: string, event: Event): void {
    event.stopPropagation();

    if (confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      this.chatService.deleteConversation(conversationId);
    }
  }

  formatLastUpdated(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
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
      return date.toLocaleDateString();
    }
  }

  getConversationPreview(conversation: Conversation): string {
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (!lastMessage) return '';

    const preview = lastMessage.content;
    return preview.length > 100 ? preview.substring(0, 100) + '...' : preview;
  }
}
