import { Injectable, signal, computed } from '@angular/core';
import { DocumentSource, DocumentMetadata, RAGDocument } from '../models/chat.models';

@Injectable({
    providedIn: 'root'
})
export class DocumentService {
    private documents = signal<RAGDocument[]>([]);
    private selectedSources = signal<string[]>([]);
    private selectedFilters = signal<Record<string, any>>({});
    private userGroups = signal<string[]>([]);

    // Computed signals
    readonly availableSources = computed(() => {
        const userGroups = this.userGroups();
        return this.documentSources().filter(source => {
            if (!source.requiresAuth) return true;
            if (!source.allowedGroups) return true;
            return source.allowedGroups.some(group => userGroups.includes(group));
        });
    });

    readonly filteredDocuments = computed(() => {
        const sources = this.selectedSources();
        const filters = this.selectedFilters();

        return this.documents().filter(doc => {
            // Filter by selected sources
            if (sources.length > 0 && !sources.includes(doc.source.id)) {
                return false;
            }

            // Apply metadata filters
            for (const [key, value] of Object.entries(filters)) {
                if (value !== null && value !== undefined && value !== '') {
                    const docValue = doc.metadata[key];
                    if (typeof value === 'string' && typeof docValue === 'string') {
                        if (!docValue.toLowerCase().includes(value.toLowerCase())) {
                            return false;
                        }
                    } else if (docValue !== value) {
                        return false;
                    }
                }
            }

            return true;
        });
    });

    readonly availableMetadataFields = computed(() => {
        const docs = this.filteredDocuments();
        const fields = new Set<string>();

        docs.forEach(doc => {
            Object.keys(doc.metadata).forEach(key => fields.add(key));
        });

        return Array.from(fields);
    });

    // Private signals
    private documentSources = signal<DocumentSource[]>([]);

    // Public getters
    get documents$() { return this.documents.asReadonly(); }
    get selectedSources$() { return this.selectedSources.asReadonly(); }
    get selectedFilters$() { return this.selectedFilters.asReadonly(); }
    get userGroups$() { return this.userGroups.asReadonly(); }

    constructor() {
        this.initializeData();
    }

    private initializeData(): void {
        // Initialize with sample data - replace with actual API calls
        this.documentSources.set([
            {
                id: 'external-docs',
                name: 'External Documentation',
                type: 'external',
                requiresAuth: false
            },
            {
                id: 'internal-docs',
                name: 'Internal Documentation',
                type: 'internal',
                requiresAuth: true,
                allowedGroups: ['engineers', 'managers', 'admins']
            }
        ]);

        // Sample documents
        this.documents.set([
            {
                id: 'doc-1',
                title: 'API Reference Guide',
                content: 'Complete API reference for the system...',
                source: this.documentSources()[0],
                metadata: {
                    dateAdded: new Date('2024-01-15'),
                    documentName: 'API Reference Guide',
                    pageNumber: 1,
                    author: 'John Doe',
                    category: 'Technical',
                    tags: ['api', 'reference', 'guide']
                },
                pageNumber: 1
            },
            {
                id: 'doc-2',
                title: 'Internal Security Policy',
                content: 'Internal security policies and procedures...',
                source: this.documentSources()[1],
                metadata: {
                    dateAdded: new Date('2024-01-20'),
                    documentName: 'Security Policy',
                    pageNumber: 1,
                    author: 'Jane Smith',
                    category: 'Security',
                    tags: ['security', 'policy', 'internal']
                },
                pageNumber: 1
            },
            {
                id: 'doc-3',
                title: 'User Manual',
                content: 'Complete user manual for the application...',
                source: this.documentSources()[0],
                metadata: {
                    dateAdded: new Date('2024-01-10'),
                    documentName: 'User Manual',
                    pageNumber: 1,
                    author: 'Bob Johnson',
                    category: 'User Guide',
                    tags: ['manual', 'user', 'guide']
                },
                pageNumber: 1
            }
        ]);

        // Set user groups (in real app, this would come from authentication)
        this.userGroups.set(['engineers', 'managers']);
    }

    selectSource(sourceId: string, selected: boolean): void {
        this.selectedSources.update(sources => {
            if (selected) {
                return sources.includes(sourceId) ? sources : [...sources, sourceId];
            } else {
                return sources.filter(id => id !== sourceId);
            }
        });
    }

    setFilter(field: string, value: any): void {
        this.selectedFilters.update(filters => ({
            ...filters,
            [field]: value
        }));
    }

    clearFilters(): void {
        this.selectedFilters.set({});
    }

    clearSourceSelection(): void {
        this.selectedSources.set([]);
    }

    getDocumentById(id: string): RAGDocument | undefined {
        return this.documents().find(doc => doc.id === id);
    }

    getDocumentsBySource(sourceId: string): RAGDocument[] {
        return this.documents().filter(doc => doc.source.id === sourceId);
    }

    getMetadataValues(field: string): any[] {
        const values = new Set();
        this.documents().forEach(doc => {
            const value = doc.metadata[field];
            if (value !== undefined && value !== null) {
                values.add(value);
            }
        });
        return Array.from(values);
    }

    async loadDocuments(): Promise<void> {
        // TODO: Implement API call to load documents
        // This would typically fetch documents from the backend
        console.log('Loading documents from API...');
    }

    async searchDocuments(query: string): Promise<RAGDocument[]> {
        // TODO: Implement document search
        // This would typically call a search API
        console.log('Searching documents with query:', query);
        return this.filteredDocuments();
    }
}
