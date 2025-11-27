import { Component, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-thinking-section',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    @if (thinkingText() || toolingText()) {
      <div class="thinking-section">
        @if (thinkingText()) {
          <div class="thinking-container">
            <button 
              mat-button 
              class="thinking-toggle"
              (click)="toggleThinking()">
              <mat-icon class="toggle-icon">{{ isThinkingExpanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
              <span class="thinking-label">Thinking</span>
            </button>
            @if (isThinkingExpanded()) {
              <div class="thinking-content">
                {{ thinkingText() }}
              </div>
            }
          </div>
        }
        @if (toolingText()) {
          <div class="tooling-container">
            <button 
              mat-button 
              class="tooling-toggle"
              (click)="toggleTooling()">
              <mat-icon class="toggle-icon">{{ isToolingExpanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
              <span class="tooling-label">{{ toolingText() }}</span>
            </button>
            @if (isToolingExpanded()) {
              <div class="tooling-content">
                <strong>Tool Action:</strong> {{ toolingText() }}
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .thinking-section {
      margin-bottom: 12px;
      font-size: 14px;
    }

    .thinking-container,
    .tooling-container {
      margin-bottom: 8px;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.02);
      overflow: hidden;
    }

    .thinking-toggle,
    .tooling-toggle {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      padding: 8px 12px;
      text-align: left;
      color: rgba(0, 0, 0, 0.7);
      font-size: 14px;
    }

    .thinking-toggle:hover,
    .tooling-toggle:hover {
      background: rgba(0, 0, 0, 0.04);
    }

    .toggle-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      margin-right: 8px;
    }

    .thinking-label,
    .tooling-label {
      font-weight: 500;
    }

    .thinking-content,
    .tooling-content {
      padding: 12px 16px;
      background: rgba(0, 0, 0, 0.01);
      border-top: 1px solid rgba(0, 0, 0, 0.08);
      white-space: pre-wrap;
      word-break: break-word;
      color: rgba(0, 0, 0, 0.8);
      line-height: 1.6;
    }

    /* Dark theme support */
    :host-context(.dark-theme) .thinking-container,
    :host-context(.dark-theme) .tooling-container {
      background: rgba(255, 255, 255, 0.05);
    }

    :host-context(.dark-theme) .thinking-toggle,
    :host-context(.dark-theme) .tooling-toggle {
      color: rgba(255, 255, 255, 0.7);
    }

    :host-context(.dark-theme) .thinking-toggle:hover,
    :host-context(.dark-theme) .tooling-toggle:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    :host-context(.dark-theme) .thinking-content,
    :host-context(.dark-theme) .tooling-content {
      background: rgba(255, 255, 255, 0.03);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThinkingSectionComponent {
  thinkingText = input<string>('');
  toolingText = input<string>('');

  isThinkingExpanded = signal(false);
  isToolingExpanded = signal(false);

  toggleThinking(): void {
    this.isThinkingExpanded.update(expanded => !expanded);
  }

  toggleTooling(): void {
    this.isToolingExpanded.update(expanded => !expanded);
  }
}
