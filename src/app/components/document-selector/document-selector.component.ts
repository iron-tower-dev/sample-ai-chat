import { Component, input, output, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DocumentService } from '../../services/document.service';
import { DocumentSource } from '../../models/chat.models';

@Component({
  selector: 'app-document-selector',
  imports: [
    CommonModule,
    FormsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="document-selector">
      <div class="selector-content">
          <!-- Source Selection -->
          <div class="source-selection">
            <h4>Select Sources</h4>
            <div class="source-grid">
              @for (source of availableSources(); track source.id) {
                <label class="source-item">
                  <input 
                    type="checkbox"
                    [checked]="isSourceSelected(source.id)"
                    (change)="toggleSource(source.id, $event)"
                    [disabled]="!isSourceAvailable(source)">
                  <div class="source-info">
                    <div class="source-header">
                      <span class="source-name">{{ source.name }}</span>
                      <span class="source-type" [class.internal]="source.type === 'internal'">
                        {{ source.type === 'internal' ? 'Int' : 'Ext' }}
                      </span>
                    </div>
                    @if (source.requiresAuth) {
                      <span class="auth-required">🔒</span>
                    }
                  </div>
                </label>
              }
            </div>
          </div>
          
          <!-- Metadata Filters -->
          @if (selectedSources().length > 0) {
            <div class="metadata-filters">
              <h4>Filters</h4>
                
                <!-- External Documents Filters -->
                @if (hasExternalSources()) {
                  <mat-expansion-panel class="filter-panel">
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        <mat-icon>public</mat-icon>
                        External Documents
                      </mat-panel-title>
                      <mat-panel-description>
                        {{ getExternalDocumentCount() }} documents
                      </mat-panel-description>
                    </mat-expansion-panel-header>
                    
                    <div class="filter-form">
                      @for (field of getExternalMetadataFields(); track field) {
                        <mat-form-field appearance="outline" class="filter-field">
                          <mat-label>{{ formatFieldName(field) }}</mat-label>
                          <input 
                            matInput
                            type="text"
                            [value]="getFilterValue(field)"
                            (input)="setFilter(field, $event)">
                        </mat-form-field>
                      }
                    </div>
                  </mat-expansion-panel>
                }
                
                <!-- Internal Documents Filters -->
                @if (hasInternalSources()) {
                  <mat-expansion-panel class="filter-panel">
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        <mat-icon>business</mat-icon>
                        Internal Documents
                      </mat-panel-title>
                      <mat-panel-description>
                        {{ getInternalDocumentCount() }} documents
                      </mat-panel-description>
                    </mat-expansion-panel-header>
                    
                    <div class="filter-form">
                      @for (field of getInternalMetadataFields(); track field) {
                        <mat-form-field appearance="outline" class="filter-field">
                          <mat-label>{{ formatFieldName(field) }}</mat-label>
                          <input 
                            matInput
                            type="text"
                            [value]="getFilterValue(field)"
                            (input)="setFilter(field, $event)">
                        </mat-form-field>
                      }
                    </div>
                  </mat-expansion-panel>
                }
                
                <div class="filter-actions">
                  <button mat-button (click)="clearFilters()" class="clear-filters-btn">
                    <mat-icon>clear</mat-icon>
                    Clear All Filters
                  </button>
                  <span class="filter-count">
                    {{ filteredDocuments().length }} documents match filters
                  </span>
                </div>
            </div>
          }
      </div>
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

  // Computed signals
  readonly availableSources = this.documentService.availableSources;
  readonly filteredDocuments = this.documentService.filteredDocuments;
  readonly availableMetadataFields = this.documentService.availableMetadataFields;

  // Computed properties for expansion panels
  readonly hasExternalSources = computed(() => {
    return this.selectedSources().some(sourceId => {
      const source = this.getSourceById(sourceId);
      return source?.type === 'external';
    });
  });

  readonly hasInternalSources = computed(() => {
    return this.selectedSources().some(sourceId => {
      const source = this.getSourceById(sourceId);
      return source?.type === 'internal';
    });
  });

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

  getExternalMetadataFields(): string[] {
    // In a real app, this would come from the API based on external document metadata
    return ['dateAdded', 'documentName', 'author', 'category'];
  }

  getInternalMetadataFields(): string[] {
    // In a real app, this would come from the API based on internal document metadata
    return ['dateAdded', 'documentName', 'department', 'pageNumber', 'version'];
  }

  getExternalDocumentCount(): number {
    // In a real app, this would be calculated from actual document counts
    return this.selectedSources().filter(sourceId => {
      const source = this.getSourceById(sourceId);
      return source?.type === 'external';
    }).length * 15; // Mock count
  }

  getInternalDocumentCount(): number {
    // In a real app, this would be calculated from actual document counts
    return this.selectedSources().filter(sourceId => {
      const source = this.getSourceById(sourceId);
      return source?.type === 'internal';
    }).length * 8; // Mock count
  }
}
