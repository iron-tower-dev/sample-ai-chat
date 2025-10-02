import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChatService } from '../../services/chat.service';
import { DocumentService } from '../../services/document.service';
import { ChatMessage, LLMModel } from '../../models/chat.models';
import { MessageComponent } from '../message/message.component';
import { DocumentSelectorComponent } from '../document-selector/document-selector.component';
import { ModelSelectorComponent } from '../model-selector/model-selector.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-chat-interface',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MessageComponent,
    DocumentSelectorComponent,
    ModelSelectorComponent,
    ThemeToggleComponent
  ],
  template: `
    <div class="chat-interface">
      <!-- Header -->
      <mat-toolbar class="chat-header" color="primary">
        <h1>AI Chat Assistant</h1>
        <span class="spacer"></span>
        <div class="header-controls">
          <app-model-selector 
            [models]="availableModels()"
            [selectedModel]="selectedModel()"
            (modelSelected)="onModelSelected($event)">
          </app-model-selector>
          <button 
            mat-raised-button
            color="accent"
            (click)="createNewConversation()"
            [disabled]="isLoading()">
            <mat-icon>add</mat-icon>
            New Conversation
          </button>
          <app-theme-toggle></app-theme-toggle>
        </div>
      </mat-toolbar>

      <!-- Document Selector -->
      <div class="document-selector-section">
        <app-document-selector
          [selectedSources]="selectedDocumentSources()"
          [selectedFilters]="selectedDocumentFilters()"
          (sourcesChanged)="onDocumentSourcesChanged($event)"
          (filtersChanged)="onDocumentFiltersChanged($event)">
        </app-document-selector>
      </div>

      <!-- Messages Container -->
      <div class="messages-container" #messagesContainer>
        @if (currentMessages().length === 0) {
          <div class="welcome-message">
            <h2>Welcome to AI Chat Assistant</h2>
            <p>Start a conversation by typing a message below. You can select document sources and models to customize your experience.</p>
          </div>
        }
        
        @for (message of currentMessages(); track message.id) {
          <app-message 
            [message]="message"
            (feedbackSubmitted)="onFeedbackSubmitted($event)">
          </app-message>
        }
        
        @if (isLoading()) {
          <div class="loading-message">
            <mat-spinner diameter="40"></mat-spinner>
            <span>AI is thinking...</span>
          </div>
        }
      </div>

      <!-- Input Area -->
      <div class="input-area">
        <div class="input-container">
          <mat-form-field appearance="outline" class="message-input-field">
            <mat-label>Type your message here...</mat-label>
            <textarea
              matInput
              #messageInput
              [(ngModel)]="currentMessage"
              (keydown.enter)="onEnterKey($event)"
              [disabled]="isLoading() || !selectedModel()"
              rows="3"
              maxlength="2000">
            </textarea>
            <mat-hint align="end">{{ currentMessage().length }}/2000</mat-hint>
          </mat-form-field>
          <button 
            mat-fab
            color="primary"
            (click)="sendMessage()"
            [disabled]="!currentMessage().trim() || isLoading() || !selectedModel()"
            class="send-button">
            <mat-icon>send</mat-icon>
          </button>
        </div>
        <div class="input-footer">
          @if (!selectedModel()) {
            <span class="warning">
              <mat-icon>warning</mat-icon>
              Please select a model to start chatting
            </span>
          }
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./chat-interface.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatInterfaceComponent {
  private chatService = inject(ChatService);
  private documentService = inject(DocumentService);

  // Signals
  currentMessage = signal('');
  selectedModel = signal<LLMModel | null>(null);
  selectedDocumentSources = signal<string[]>([]);
  selectedDocumentFilters = signal<any[]>([]);

  // Computed signals
  readonly currentMessages = this.chatService.currentMessages$;
  readonly availableModels = this.chatService.availableModels$;
  readonly isLoading = this.chatService.isLoading$;

  onModelSelected(model: LLMModel): void {
    this.selectedModel.set(model);
  }

  onDocumentSourcesChanged(sources: string[]): void {
    this.selectedDocumentSources.set(sources);
  }

  onDocumentFiltersChanged(filters: any[]): void {
    this.selectedDocumentFilters.set(filters);
  }

  async sendMessage(): Promise<void> {
    const message = this.currentMessage().trim();
    const model = this.selectedModel();

    if (!message || !model || this.isLoading()) {
      return;
    }

    try {
      await this.chatService.sendMessage(
        message,
        model.id,
        this.selectedDocumentSources(),
        this.selectedDocumentFilters()
      );

      this.currentMessage.set('');
      this.scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  onEnterKey(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  createNewConversation(): void {
    this.chatService.createNewConversation();
  }

  onFeedbackSubmitted(feedback: { messageId: string; type: 'positive' | 'negative'; comment?: string }): void {
    this.chatService.submitFeedback(feedback.messageId, feedback.type, feedback.comment);
  }

  private scrollToBottom(): void {
    // Scroll to bottom after a short delay to allow DOM updates
    setTimeout(() => {
      const container = document.querySelector('.messages-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }
}
