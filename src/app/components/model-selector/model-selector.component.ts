import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { LLMModel } from '../../models/chat.models';

@Component({
  selector: 'app-model-selector',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatChipsModule
  ],
  template: `
    <div class="model-selector">
      <mat-form-field appearance="outline" class="model-select-field">
        <mat-label>Select Model</mat-label>
        <mat-select 
          [value]="selectedModel()?.id || ''"
          (selectionChange)="onModelChange($event)">
          @for (model of models(); track model.id) {
            <mat-option 
              [value]="model.id"
              [disabled]="!model.isAvailable">
              {{ model.name }}
              @if (!model.isAvailable) {
                (Unavailable)
              }
            </mat-option>
          }
        </mat-select>
      </mat-form-field>
      
      @if (selectedModel()) {
        <mat-card class="model-info-card">
          <mat-card-content>
            <h4 class="model-name">{{ selectedModel()!.name }}</h4>
            @if (selectedModel()!.description) {
              <p class="model-description">{{ selectedModel()!.description }}</p>
            }
            @if (selectedModel()!.maxTokens) {
              <mat-chip-set>
                <mat-chip>{{ selectedModel()!.maxTokens!.toLocaleString() }} tokens</mat-chip>
              </mat-chip-set>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styleUrls: ['./model-selector.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModelSelectorComponent {
  models = input.required<LLMModel[]>();
  selectedModel = input<LLMModel | null>(null);

  modelSelected = output<LLMModel>();

  onModelChange(event: any): void {
    const modelId = event.value;

    if (modelId) {
      const model = this.models().find(m => m.id === modelId);
      if (model && model.isAvailable) {
        this.modelSelected.emit(model);
      }
    }
  }
}
