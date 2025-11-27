import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-followup-questions',
  imports: [CommonModule, MatChipsModule, MatIconModule],
  template: `
    @if (questions() && questions()!.followups.length > 0) {
      <div class="followup-questions">
        <div class="followup-header">
          <mat-icon class="followup-icon">lightbulb_outline</mat-icon>
          <span class="followup-title">Suggested questions:</span>
        </div>
        <div class="questions-chips">
          @for (question of questions()!.followups; track question) {
            <button 
              class="question-chip"
              (click)="questionSelected.emit(question)"
              type="button">
              {{ question }}
            </button>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .followup-questions {
      padding: 12px 16px;
      background: var(--bg-secondary);
      border-radius: 12px;
      margin-bottom: 16px;
    }

    .followup-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 500;
    }

    .followup-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--mat-primary-500);
    }

    .followup-title {
      font-weight: 600;
    }

    .questions-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .question-chip {
      display: inline-flex;
      align-items: center;
      padding: 8px 16px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      font-size: 14px;
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;
      line-height: 1.4;
    }

    .question-chip:hover {
      background: var(--mat-primary-50);
      border-color: var(--mat-primary-500);
      color: var(--mat-primary-700);
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .question-chip:active {
      transform: translateY(0);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    /* Dark theme support */
    :host-context(.dark-theme) .followup-questions {
      background: rgba(255, 255, 255, 0.05);
    }

    :host-context(.dark-theme) .question-chip {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.87);
    }

    :host-context(.dark-theme) .question-chip:hover {
      background: rgba(99, 102, 241, 0.15);
      border-color: var(--mat-primary-400);
      color: var(--mat-primary-300);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FollowupQuestionsComponent {
  questions = input<{ topic: string; followups: string[] }>();
  questionSelected = output<string>();
}
