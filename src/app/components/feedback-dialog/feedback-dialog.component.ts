import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface FeedbackDialogData {
  messageId: string;
  type: 'positive' | 'negative';
}

export interface FeedbackDialogResult {
  messageId: string;
  type: 'positive' | 'negative';
  comment?: string;
}

@Component({
  selector: 'app-feedback-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  template: `
    <div class="feedback-dialog">
      <div class="dialog-header">
        <div class="feedback-icon" [class.positive]="data.type === 'positive'" [class.negative]="data.type === 'negative'">
          <mat-icon>{{ data.type === 'positive' ? 'thumb_up' : 'thumb_down' }}</mat-icon>
        </div>
        <h2 mat-dialog-title>
          {{ data.type === 'positive' ? 'Great Response!' : 'Help Us Improve' }}
        </h2>
      </div>

      <div mat-dialog-content>
        <p class="feedback-description">
          @if (data.type === 'positive') {
            We're glad this response was helpful! Would you like to share what worked well?
          } @else {
            We're sorry this response wasn't helpful. Could you tell us what went wrong or how we can improve?
          }
        </p>

        <mat-form-field appearance="outline" class="feedback-input">
          <mat-label>
            {{ data.type === 'positive' ? 'What worked well? (optional)' : 'How can we improve? (optional)' }}
          </mat-label>
          <textarea
            matInput
            [(ngModel)]="comment"
            [placeholder]="getPlaceholderText()"
            rows="4"
            maxlength="1000"
            class="feedback-textarea"></textarea>
          <mat-hint align="end">{{ comment().length }}/1000</mat-hint>
        </mat-form-field>
      </div>

      <div mat-dialog-actions align="end" class="dialog-actions">
        <button mat-button (click)="onCancel()" type="button">
          Skip
        </button>
        <button 
          mat-flat-button 
          [color]="data.type === 'positive' ? 'primary' : 'warn'"
          (click)="onSubmit()" 
          type="button">
          Submit Feedback
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./feedback-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedbackDialogComponent {
  private dialogRef = inject(MatDialogRef<FeedbackDialogComponent>);
  readonly data = inject<FeedbackDialogData>(MAT_DIALOG_DATA);

  comment = signal('');

  getPlaceholderText(): string {
    if (this.data.type === 'positive') {
      return 'The response was accurate, well-formatted, helpful...';
    } else {
      return 'The response was inaccurate, unclear, unhelpful...';
    }
  }

  onSubmit(): void {
    const result: FeedbackDialogResult = {
      messageId: this.data.messageId,
      type: this.data.type,
      comment: this.comment().trim() || undefined
    };
    this.dialogRef.close(result);
  }

  onCancel(): void {
    // Still submit feedback but without comment
    const result: FeedbackDialogResult = {
      messageId: this.data.messageId,
      type: this.data.type
    };
    this.dialogRef.close(result);
  }
}