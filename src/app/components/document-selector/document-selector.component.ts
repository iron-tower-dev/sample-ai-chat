import { Component, input, output, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../../services/document.service';
import { DocumentSource } from '../../models/chat.models';

@Component({
    selector: 'app-document-selector',
    imports: [CommonModule, FormsModule],
    template: `
    <div class="document-selector">
      <div class="selector-header">
        <h3>Document Sources</h3>
        <button 
          class="toggle-btn"
          (click)="isExpanded.set(!isExpanded())"
          [class.expanded]="isExpanded()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6,9 12,15 18,9"></polyline>
          </svg>
        </button>
      </div>
      
      @if (isExpanded()) {
        <div class="selector-content">
          <!-- Source Selection -->
          <div class="source-selection">
            <h4>Select Sources</h4>
            <div class="source-list">
              @for (source of availableSources(); track source.id) {
                <label class="source-item">
                  <input 
                    type="checkbox"
                    [checked]="isSourceSelected(source.id)"
                    (change)="toggleSource(source.id, $event)"
                    [disabled]="!isSourceAvailable(source)">
                  <div class="source-info">
                    <span class="source-name">{{ source.name }}</span>
                    <span class="source-type" [class.internal]="source.type === 'internal'">
                      {{ source.type === 'internal' ? 'Internal' : 'External' }}
                    </span>
                    @if (source.requiresAuth) {
                      <span class="auth-required">🔒 Requires Authorization</span>
                    }
                  </div>
                </label>
              }
            </div>
          </div>
          
          <!-- Metadata Filters -->
          @if (selectedSources().length > 0) {
            <div class="metadata-filters">
              <h4>Filter by Metadata</h4>
              <div class="filters-grid">
                @for (field of availableMetadataFields(); track field) {
                  <div class="filter-item">
                    <label class="filter-label">{{ formatFieldName(field) }}</label>
                    <input 
                      type="text"
                      [placeholder]="'Filter by ' + formatFieldName(field)"
                      [value]="getFilterValue(field)"
                      (input)="setFilter(field, $event)"
                      class="filter-input">
                  </div>
                }
              </div>
              <div class="filter-actions">
                <button class="clear-filters-btn" (click)="clearFilters()">
                  Clear Filters
                </button>
                <span class="filter-count">
                  {{ filteredDocuments().length }} documents available
                </span>
              </div>
            </div>
          }
          
          <!-- Selected Summary -->
          @if (selectedSources().length > 0) {
            <div class="selection-summary">
              <h4>Selected Sources</h4>
              <div class="summary-items">
                @for (sourceId of selectedSources(); track sourceId) {
                  @if (getSourceById(sourceId)) {
                    <span class="summary-item">
                      {{ getSourceById(sourceId)!.name }}
                      <button 
                        class="remove-source"
                        (click)="removeSource(sourceId)">
                        ×
                      </button>
                    </span>
                  }
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
    styleUrls: ['./document-selector.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentSelectorComponent {
    private documentService = inject(DocumentService);

    selectedSources = input<string[]>([]);
    selectedFilters = input<any[]>([]);

    sourcesChanged = output<string[]>();
    filtersChanged = output<any[]>();

    isExpanded = signal(false);

    // Computed signals
    readonly availableSources = this.documentService.availableSources;
    readonly filteredDocuments = this.documentService.filteredDocuments;
    readonly availableMetadataFields = this.documentService.availableMetadataFields;

    isSourceSelected(sourceId: string): boolean {
        return this.selectedSources().includes(sourceId);
    }

    isSourceAvailable(source: DocumentSource): boolean {
        // In a real app, this would check user permissions
        return true;
    }

    toggleSource(sourceId: string, event: Event): void {
        const target = event.target as HTMLInputElement;
        const sources = this.selectedSources();

        if (target.checked) {
            this.sourcesChanged.emit([...sources, sourceId]);
        } else {
            this.sourcesChanged.emit(sources.filter(id => id !== sourceId));
        }
    }

    removeSource(sourceId: string): void {
        const sources = this.selectedSources().filter(id => id !== sourceId);
        this.sourcesChanged.emit(sources);
    }

    getFilterValue(field: string): string {
        const filters = this.selectedFilters();
        const filter = filters.find(f => f.field === field);
        return filter ? filter.value : '';
    }

    setFilter(field: string, event: Event): void {
        const target = event.target as HTMLInputElement;
        const value = target.value;

        const filters = this.selectedFilters().filter(f => f.field !== field);
        if (value.trim()) {
            filters.push({ field, value: value.trim() });
        }

        this.filtersChanged.emit(filters);
    }

    clearFilters(): void {
        this.filtersChanged.emit([]);
    }

    getSourceById(sourceId: string): DocumentSource | undefined {
        return this.availableSources().find(source => source.id === sourceId);
    }

    formatFieldName(field: string): string {
        return field
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }
}
