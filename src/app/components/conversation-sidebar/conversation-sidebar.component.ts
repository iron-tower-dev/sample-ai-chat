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
      <mat-toolbar class="sidebar-header" color="primary">
        <h2>Conversations</h2>
        <span class="spacer"></span>
        <button 
          mat-icon-button
          color="accent"
          (click)="createNewConversation()"
          matTooltip="New Conversation">
          <mat-icon>add</mat-icon>
        </button>
      </mat-toolbar>
      
      <div class="conversations-list">
        @if (conversations().length === 0) {
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <p>No conversations yet</p>
            <span>Start a new conversation to begin</span>
          </div>
        } @else {
          <mat-list>
            @for (conversation of conversations(); track conversation.id) {
              <mat-list-item 
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
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                  <div class="conversation-meta">
                    <span class="message-count">{{ conversation.messages.length }} messages</span>
                    <span class="last-updated">{{ formatLastUpdated(conversation.updatedAt) }}</span>
                  </div>
                  @if (conversation.messages.length > 0) {
                    <div class="conversation-preview">
                      {{ getConversationPreview(conversation) }}
                    </div>
                  }
                </div>
              </mat-list-item>
              <mat-divider></mat-divider>
            }
          </mat-list>
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
  readonly conversations = this.chatService.conversations$;
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
