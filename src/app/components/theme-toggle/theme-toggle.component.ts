import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService, ThemeMode } from '../../services/theme.service';

@Component({
    selector: 'app-theme-toggle',
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatTooltipModule
    ],
    template: `
    <button 
      mat-icon-button
      [matMenuTriggerFor]="themeMenu"
      [matTooltip]="themeService.getThemeLabel()"
      class="theme-toggle-btn">
      <mat-icon>{{ themeService.getThemeIcon() }}</mat-icon>
    </button>

    <mat-menu #themeMenu="matMenu" class="theme-menu">
      <button 
        mat-menu-item
        (click)="setTheme('light')"
        [class.active]="themeService.themeMode$() === 'light'">
        <mat-icon>light_mode</mat-icon>
        <span>Light</span>
      </button>
      
      <button 
        mat-menu-item
        (click)="setTheme('dark')"
        [class.active]="themeService.themeMode$() === 'dark'">
        <mat-icon>dark_mode</mat-icon>
        <span>Dark</span>
      </button>
      
      <button 
        mat-menu-item
        (click)="setTheme('system')"
        [class.active]="themeService.themeMode$() === 'system'">
        <mat-icon>computer</mat-icon>
        <span>System</span>
        <span class="system-indicator">({{ themeService.currentTheme$() }})</span>
      </button>
    </mat-menu>
  `,
    styleUrls: ['./theme-toggle.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemeToggleComponent {
    themeService = inject(ThemeService);

    setTheme(mode: ThemeMode): void {
        this.themeService.setThemeMode(mode);
    }
}
