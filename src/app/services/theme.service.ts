import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { THEMES, Theme } from '../models/theme.models';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private document = inject(DOCUMENT);
    private currentThemeId = signal<string>('blue-purple-light');

    constructor() {
        // Load theme from localStorage on initialization
        const savedThemeId = localStorage.getItem('selected-theme-id');

        if (savedThemeId && THEMES.find(t => t.id === savedThemeId)) {
            this.currentThemeId.set(savedThemeId);
        } else {
            // Default to system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const defaultTheme = prefersDark ? 'blue-purple-dark' : 'blue-purple-light';
            this.currentThemeId.set(defaultTheme);
        }

        // Apply theme to document immediately with a small delay to ensure CSS is loaded
        setTimeout(() => {
            const initialTheme = this.getThemeById(this.currentThemeId());
            if (initialTheme) {
                this.applyTheme(initialTheme);
            }
        }, 0);

        // Apply theme to document when theme changes
        effect(() => {
            const themeId = this.currentThemeId();
            const theme = this.getThemeById(themeId);
            if (theme) {
                this.applyTheme(theme);
                localStorage.setItem('selected-theme-id', themeId);
            }
        });
    }

    get currentThemeId$() { return this.currentThemeId; }
    get currentTheme() { return this.getThemeById(this.currentThemeId()); }
    get availableThemes() { return THEMES; }

    getThemeById(id: string): Theme | undefined {
        return THEMES.find(theme => theme.id === id);
    }

    setTheme(themeId: string): void {
        const theme = THEMES.find(t => t.id === themeId);
        if (theme) {
            this.currentThemeId.set(themeId);
        } else {
            console.warn('Theme not found:', themeId);
        }
    }

    toggleTheme(): void {
        const currentTheme = this.currentTheme;
        if (currentTheme) {
            const oppositeMode = currentTheme.mode === 'light' ? 'dark' : 'light';
            const baseName = currentTheme.name.replace(/\s+(Light|Dark)$/, '');
            const oppositeTheme = THEMES.find(t =>
                t.mode === oppositeMode && t.name.includes(baseName)
            );
            if (oppositeTheme) {
                this.setTheme(oppositeTheme.id);
            }
        }
    }

    private setToolbarColors(themeId: string): void {
        const root = this.document.documentElement;

        // Define light mode primary colors for each theme
        const lightModePrimaryColors: Record<string, { primary: string; onPrimary: string; primaryContainer: string; onPrimaryContainer: string }> = {
            'blue-purple-light': { primary: '#1976D2', onPrimary: '#FFFFFF', primaryContainer: '#BBDEFB', onPrimaryContainer: '#0D47A1' },
            'blue-purple-dark': { primary: '#1976D2', onPrimary: '#FFFFFF', primaryContainer: '#BBDEFB', onPrimaryContainer: '#0D47A1' },
            'green-light': { primary: '#2E7D32', onPrimary: '#FFFFFF', primaryContainer: '#C8E6C9', onPrimaryContainer: '#1B5E20' },
            'green-dark': { primary: '#2E7D32', onPrimary: '#FFFFFF', primaryContainer: '#C8E6C9', onPrimaryContainer: '#1B5E20' },
            'blue-light': { primary: '#1976D2', onPrimary: '#FFFFFF', primaryContainer: '#BBDEFB', onPrimaryContainer: '#0D47A1' },
            'blue-dark': { primary: '#1976D2', onPrimary: '#FFFFFF', primaryContainer: '#BBDEFB', onPrimaryContainer: '#0D47A1' },
            'purple-light': { primary: '#7B1FA2', onPrimary: '#FFFFFF', primaryContainer: '#E1BEE7', onPrimaryContainer: '#4A148C' },
            'purple-dark': { primary: '#7B1FA2', onPrimary: '#FFFFFF', primaryContainer: '#E1BEE7', onPrimaryContainer: '#4A148C' }
        };

        const toolbarColors = lightModePrimaryColors[themeId] || lightModePrimaryColors['blue-purple-light'];

        // Set toolbar-specific CSS variables
        root.style.setProperty('--toolbar-primary', toolbarColors.primary);
        root.style.setProperty('--toolbar-on-primary', toolbarColors.onPrimary);
        root.style.setProperty('--toolbar-primary-container', toolbarColors.primaryContainer);
        root.style.setProperty('--toolbar-on-primary-container', toolbarColors.onPrimaryContainer);
    }

    private applyTheme(theme: Theme): void {
        const root = this.document.documentElement;

        // Set theme mode
        root.setAttribute('data-theme', theme.mode);

        // Apply CSS custom properties
        const colors = theme.colors;
        root.style.setProperty('--md-primary', colors.primary);
        root.style.setProperty('--md-on-primary', colors.onPrimary);
        root.style.setProperty('--md-primary-container', colors.primaryContainer);
        root.style.setProperty('--md-on-primary-container', colors.onPrimaryContainer);
        root.style.setProperty('--md-secondary', colors.secondary);
        root.style.setProperty('--md-on-secondary', colors.onSecondary);
        root.style.setProperty('--md-secondary-container', colors.secondaryContainer);
        root.style.setProperty('--md-on-secondary-container', colors.onSecondaryContainer);
        root.style.setProperty('--md-tertiary', colors.tertiary);
        root.style.setProperty('--md-on-tertiary', colors.onTertiary);
        root.style.setProperty('--md-tertiary-container', colors.tertiaryContainer);
        root.style.setProperty('--md-on-tertiary-container', colors.onTertiaryContainer);
        root.style.setProperty('--md-error', colors.error);
        root.style.setProperty('--md-on-error', colors.onError);
        root.style.setProperty('--md-error-container', colors.errorContainer);
        root.style.setProperty('--md-on-error-container', colors.onErrorContainer);
        root.style.setProperty('--md-background', colors.background);
        root.style.setProperty('--md-on-background', colors.onBackground);
        root.style.setProperty('--md-surface', colors.surface);
        root.style.setProperty('--md-on-surface', colors.onSurface);
        root.style.setProperty('--md-surface-variant', colors.surfaceVariant);
        root.style.setProperty('--md-on-surface-variant', colors.onSurfaceVariant);
        root.style.setProperty('--md-outline', colors.outline);
        root.style.setProperty('--md-outline-variant', colors.outlineVariant);
        root.style.setProperty('--md-shadow', colors.shadow);
        root.style.setProperty('--md-scrim', colors.scrim);
        root.style.setProperty('--md-inverse-surface', colors.inverseSurface);
        root.style.setProperty('--md-inverse-on-surface', colors.inverseOnSurface);
        root.style.setProperty('--md-inverse-primary', colors.inversePrimary);

        // Set toolbar colors to always use light mode primary colors
        this.setToolbarColors(theme.id);

        // Legacy theme variables for backward compatibility
        root.style.setProperty('--primary-color', colors.primary);
        root.style.setProperty('--accent-color', colors.secondary);
        root.style.setProperty('--bg-primary', colors.background);
        root.style.setProperty('--bg-secondary', colors.surface);
        root.style.setProperty('--text-primary', colors.onBackground);
        root.style.setProperty('--text-secondary', colors.onSurface);
    }
}