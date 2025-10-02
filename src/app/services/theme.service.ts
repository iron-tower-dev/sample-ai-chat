import { Injectable, signal, computed, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private document = inject(DOCUMENT);

    private themeMode = signal<ThemeMode>('system');
    private systemPrefersDark = signal(false);

    // Computed signal for the actual theme being applied
    readonly currentTheme = computed(() => {
        const mode = this.themeMode();
        if (mode === 'system') {
            return this.systemPrefersDark() ? 'dark' : 'light';
        }
        return mode;
    });

    // Public getters
    get themeMode$() { return this.themeMode.asReadonly(); }
    get currentTheme$() { return this.currentTheme; }

    constructor() {
        this.initializeTheme();
        this.setupSystemPreferenceListener();
    }

    private initializeTheme(): void {
        // Load saved theme preference
        const savedTheme = localStorage.getItem('theme-mode') as ThemeMode;
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
            this.themeMode.set(savedTheme);
        } else {
            this.themeMode.set('system');
        }

        // Check system preference
        this.updateSystemPreference();
        this.applyTheme();
    }

    private setupSystemPreferenceListener(): void {
        if (typeof window !== 'undefined' && window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            this.updateSystemPreference();

            mediaQuery.addEventListener('change', () => {
                this.updateSystemPreference();
                if (this.themeMode() === 'system') {
                    this.applyTheme();
                }
            });
        }
    }

    private updateSystemPreference(): void {
        if (typeof window !== 'undefined' && window.matchMedia) {
            this.systemPrefersDark.set(window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
    }

    setThemeMode(mode: ThemeMode): void {
        this.themeMode.set(mode);
        localStorage.setItem('theme-mode', mode);
        this.applyTheme();
    }

    toggleTheme(): void {
        const current = this.currentTheme();
        const newMode = current === 'light' ? 'dark' : 'light';
        this.setThemeMode(newMode);
    }

    private applyTheme(): void {
        const theme = this.currentTheme();
        const body = this.document.body;

        // Remove existing theme classes
        body.classList.remove('light-theme', 'dark-theme');

        // Add new theme class
        body.classList.add(`${theme}-theme`);

        // Update data attribute for CSS custom properties
        body.setAttribute('data-theme', theme);
    }

    getThemeIcon(): string {
        const mode = this.themeMode();
        const current = this.currentTheme();

        if (mode === 'system') {
            return 'computer';
        }
        return current === 'light' ? 'light_mode' : 'dark_mode';
    }

    getThemeLabel(): string {
        const mode = this.themeMode();
        const current = this.currentTheme();

        if (mode === 'system') {
            return `System (${current})`;
        }
        return current === 'light' ? 'Light' : 'Dark';
    }
}
