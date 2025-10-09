import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { THEMES, Theme } from '../models/theme.models';
import { environment } from '../../environments/environment';

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

        // Apply theme to document immediately
        setTimeout(() => {
            this.applyTheme();
            this.addEnvironmentWatermark();
        }, 0);

        // Apply theme to document when theme changes
        effect(() => {
            this.applyTheme();
            localStorage.setItem('selected-theme-id', this.currentThemeId());
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
            const baseName = currentTheme.baseName;
            const oppositeTheme = THEMES.find(t =>
                t.mode === oppositeMode && t.baseName === baseName
            );
            if (oppositeTheme) {
                this.setTheme(oppositeTheme.id);
            }
        }
    }

    private applyTheme(): void {
        const body = this.document.body;
        const theme = this.currentTheme;

        if (!theme) {
            console.warn('No theme found for ID:', this.currentThemeId());
            return;
        }

        // Remove all existing theme classes
        THEMES.forEach(t => {
            body.classList.remove(t.cssClass);
        });

        // Add the current theme class
        body.classList.add(theme.cssClass);

        // Set color scheme preference
        this.document.documentElement.style.setProperty('color-scheme', theme.mode);
    }

    private addEnvironmentWatermark(): void {
        const body = this.document.body;

        // Remove existing watermark classes
        body.classList.remove('dev-watermark', 'test-watermark', 'prod-watermark');

        // Add watermark class based on environment
        if (environment.production) {
            body.classList.add('prod-watermark');
        } else if (environment.testing) {
            body.classList.add('test-watermark');
        } else {
            body.classList.add('dev-watermark');
        }
    }
}