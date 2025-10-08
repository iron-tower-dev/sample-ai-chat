import { Component, input, output, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { LLMModel } from '../../models/chat.models';

@Component({
  selector: 'app-model-selector',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
    MatIconModule
  ],
  template: `
    <div class="model-selector">
      <mat-form-field appearance="outline" class="model-select-field" subscriptSizing="dynamic">
        <mat-label>Model</mat-label>
        <mat-select 
          [value]="selectedModel()?.id || ''"
          (selectionChange)="onModelChange($event)"
          [matTooltip]="modelTooltip()"
          matTooltipPosition="below"
          matTooltipShowDelay="500">
          @for (model of models(); track model.id) {
            <mat-option 
              [value]="model.id"
              [disabled]="!model.isAvailable">
              <div class="model-option">
                <span class="model-option-name">{{ model.name }}</span>
                @if (model.description) {
                  <span class="model-option-desc">{{ model.description }}</span>
                }
                @if (model.maxTokens) {
                  <span class="model-option-tokens">{{ model.maxTokens.toLocaleString() }} tokens</span>
                }
                @if (!model.isAvailable) {
                  <span class="model-option-unavailable">(Unavailable)</span>
                }
              </div>
            </mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>
  `,
  styleUrls: ['./model-selector.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModelSelectorComponent {
  models = input.required<LLMModel[]>();
  selectedModel = input<LLMModel | null>(null);

  modelSelected = output<LLMModel>();

  // Computed tooltip text
  readonly modelTooltip = computed(() => {
    const model = this.selectedModel();
    if (!model) return '';
    
    let tooltip = model.name;
    if (model.description) {
      tooltip += `\n${model.description}`;
    }
    if (model.maxTokens) {
      tooltip += `\n${model.maxTokens.toLocaleString()} tokens max`;
    }
    return tooltip;
  });

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
