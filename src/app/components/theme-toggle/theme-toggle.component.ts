import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <button 
      mat-icon-button
      (click)="toggleTheme()"
      [matTooltip]="getTooltipText()"
      class="theme-toggle-btn">
      <mat-icon>{{ getThemeIcon() }}</mat-icon>
    </button>
  `,
  styleUrls: ['./theme-toggle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemeToggleComponent {
  themeService = inject(ThemeService);

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  getThemeIcon(): string {
    const currentTheme = this.themeService.currentTheme;
    return currentTheme?.mode === 'dark' ? 'dark_mode' : 'light_mode';
  }

  getTooltipText(): string {
    const currentTheme = this.themeService.currentTheme;
    return currentTheme?.mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  }
}