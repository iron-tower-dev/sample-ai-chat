import { Component, signal, computed, inject, effect, ViewChild, ElementRef, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChatService } from '../../services/chat.service';
import { DocumentService } from '../../services/document.service';
import { ChatMessage, LLMModel } from '../../models/chat.models';
import { MessageComponent } from '../message/message.component';
import { DocumentSelectorComponent } from '../document-selector/document-selector.component';
import { ModelSelectorComponent } from '../model-selector/model-selector.component';

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
    MatProgressSpinnerModule,
    MatTooltipModule,
    MessageComponent,
    DocumentSelectorComponent,
    ModelSelectorComponent
  ],
  template: `
    <div class="chat-interface" style="flex: 1 1 0; min-height: 0; max-height: 100%; overflow: hidden; display: flex; flex-direction: column;">
      <!-- Chat Controls -->
      <div class="chat-controls">
        <app-model-selector 
          [models]="availableModels()"
          [selectedModel]="selectedModel()"
          (modelSelected)="onModelSelected($event)">
        </app-model-selector>
        <button 
          mat-icon-button
          (click)="createNewConversation()"
          [disabled]="isLoading()"
          matTooltip="New Conversation">
          <mat-icon>add</mat-icon>
        </button>
      </div>

      <!-- Messages Container -->
      <div class="messages-container" #scrollContainer (scroll)="onMessagesScroll($event)">
        @if (currentMessages().length === 0) {
          <div class="welcome-message">
            <div class="welcome-icon">
              <mat-icon>chat_bubble_outline</mat-icon>
            </div>
            <h2>Welcome to AI Chat Assistant</h2>
            <p>Start a conversation by typing a message below.</p>
            <p class="welcome-hint">Select a model and optionally choose document sources to customize your experience.</p>
          </div>
        }
        
        @for (message of currentMessages(); track message.id) {
          <app-message 
            [message]="message"
            [isLoading]="isLoading()"
            (feedbackSubmitted)="onFeedbackSubmitted($event)">
          </app-message>
        }
        
        <!-- Scroll to Bottom Button -->
        @if (!autoScrollEnabled() && currentMessages().length > 0) {
          <button 
            mat-fab
            class="scroll-to-bottom-btn"
            (click)="scrollToBottomManual()"
            matTooltip="Scroll to bottom">
            <mat-icon>arrow_downward</mat-icon>
          </button>
        }
      </div>

      <!-- Input Area -->
      <div class="input-area">
        <div class="input-wrapper">
          <div class="input-container">
            <textarea
              #messageInput
              [(ngModel)]="currentMessage"
              (keydown.enter)="onEnterKey($event)"
              [disabled]="isLoading() || !selectedModel()"
              placeholder="Send a message..."
              rows="1"
              maxlength="2000"
              class="message-input"></textarea>
            <div class="input-actions">
              <div class="input-actions-left">
                <button 
                  mat-icon-button
                  (click)="toggleDocumentSelector()"
                  [class.active]="showDocumentSelector()"
                  class="document-selector-button"
                  matTooltip="Document Sources">
                  <mat-icon>{{selectedDocumentSources().length > 0 ? 'folder' : 'folder_open'}}</mat-icon>
                </button>
                @if (selectedDocumentSources().length > 0) {
                  <span class="sources-badge">{{ selectedDocumentSources().length }}</span>
                }
              </div>
              <div class="input-actions-right">
                <span class="char-count">{{ currentMessage().length }}/2000</span>
                <button 
                  mat-icon-button
                  color="primary"
                  (click)="sendMessage()"
                  [disabled]="!currentMessage().trim() || isLoading() || !selectedModel()"
                  class="send-button"
                  matTooltip="Send message">
                  <mat-icon>send</mat-icon>
                </button>
              </div>
            </div>
          </div>
          @if (!selectedModel()) {
            <div class="input-warning">
              <mat-icon>info</mat-icon>
              <span>Please select a model to start chatting</span>
            </div>
          }
          
          <!-- Document Selector Panel -->
          @if (showDocumentSelector()) {
            <div class="document-selector-panel">
              <app-document-selector
                [selectedSources]="selectedDocumentSources()"
                [selectedFilters]="selectedDocumentFilters()"
                (sourcesChanged)="onDocumentSourcesChanged($event)"
                (filtersChanged)="onDocumentFiltersChanged($event)">
              </app-document-selector>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./chat-interface.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatInterfaceComponent implements AfterViewInit {
  private chatService = inject(ChatService);
  private documentService = inject(DocumentService);

  // View children
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  // Signals
  currentMessage = signal('');
  selectedModel = signal<LLMModel | null>(null);
  selectedDocumentSources = signal<string[]>([]);
  selectedDocumentFilters = signal<any[]>([]);
  showDocumentSelector = signal(false);
  autoScrollEnabled = signal(true);

  // Computed signals
  readonly currentMessages = this.chatService.currentMessages$;
  readonly availableModels = this.chatService.availableModels$;
  readonly isLoading = this.chatService.isLoading$;

  ngAfterViewInit(): void {
    // Scroll to bottom on initial load
    setTimeout(() => this.scrollToBottom(), 200);
  }

  constructor() {
    // Auto-scroll when messages change
    effect(() => {
      const messages = this.currentMessages();
      const autoScroll = this.autoScrollEnabled();
      
      if (messages.length > 0 && autoScroll) {
        // Use setTimeout to ensure DOM is updated
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });

    // Auto-scroll while loading (for streaming responses)
    effect(() => {
      const loading = this.isLoading();
      
      if (loading) {
        this.startAutoScroll();
      } else {
        this.stopAutoScroll();
        // Scroll one final time after loading completes
        setTimeout(() => this.scrollToBottom(), 150);
      }
    });

    // Scroll when conversation changes
    effect(() => {
      const conversationId = this.chatService.currentConversationId$();
      
      if (conversationId) {
        this.autoScrollEnabled.set(true);
        // Give DOM time to render new conversation
        setTimeout(() => this.scrollToBottom(), 200);
      }
    });
  }

  private scrollInterval: any = null;

  private startAutoScroll(): void {
    // Clear any existing interval
    this.stopAutoScroll();
    
    // Scroll immediately
    this.scrollToBottom();
    
    // Then scroll periodically while loading (for streaming)
    this.scrollInterval = setInterval(() => {
      if (this.isLoading() && this.autoScrollEnabled()) {
        this.scrollToBottom();
      }
    }, 100); // Scroll every 100ms during streaming
  }

  private stopAutoScroll(): void {
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
    }
  }

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

    // Enable auto-scroll for new messages
    this.autoScrollEnabled.set(true);

    try {
      await this.chatService.sendMessage(
        message,
        model.id,
        this.selectedDocumentSources(),
        this.selectedDocumentFilters()
      );

      this.currentMessage.set('');
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

  toggleDocumentSelector(): void {
    this.showDocumentSelector.update(show => !show);
  }

  onFeedbackSubmitted(feedback: { messageId: string; type: 'positive' | 'negative'; comment?: string }): void {
    this.chatService.submitFeedback(feedback.messageId, feedback.type, feedback.comment);
  }

  private scrollToBottom(): void {
    if (!this.scrollContainer?.nativeElement) return;
    
    const element = this.scrollContainer.nativeElement;
    element.scrollTop = element.scrollHeight;
  }

  // Detect if user scrolled up manually
  onMessagesScroll(event: Event): void {
    if (!this.scrollContainer?.nativeElement) return;
    
    const element = this.scrollContainer.nativeElement;
    const scrolledToBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 100;
    
    // Disable auto-scroll if user scrolled up
    if (!scrolledToBottom && !this.isLoading()) {
      this.autoScrollEnabled.set(false);
    } else {
      this.autoScrollEnabled.set(true);
    }
  }

  scrollToBottomManual(): void {
    this.autoScrollEnabled.set(true);
    this.scrollToBottom();
  }
}
