import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';
import { Theme } from '../../models/theme.models';

@Component({
  selector: 'app-theme-selector-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatRadioModule,
    MatFormFieldModule,
    MatDividerModule,
    MatIconModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="theme-selector-dialog">
      <h2 mat-dialog-title>
        <mat-icon>palette</mat-icon>
        Choose Theme
      </h2>
      
      <mat-dialog-content class="theme-content">
        <div class="theme-groups">
          <!-- Light Themes -->
          <div class="theme-group">
            <h3 class="group-title">
              <mat-icon>light_mode</mat-icon>
              Light Themes
            </h3>
            <mat-radio-group [formControl]="themeControl" class="theme-options">
              @for (theme of lightThemes; track theme.id) {
                <div class="theme-option" [class.selected]="themeControl.value === theme.id">
                  <mat-radio-button 
                    [value]="theme.id"
                    class="theme-radio">
                    <div class="theme-info">
                      <span class="theme-name">{{ theme.name }}</span>
                      <div class="theme-preview">
                        <div class="preview-color primary" [style.background-color]="theme.preview.primary"></div>
                        <div class="preview-color secondary" [style.background-color]="theme.preview.secondary"></div>
                        <div class="preview-color tertiary" [style.background-color]="theme.preview.tertiary"></div>
                        <div class="preview-color background" [style.background-color]="theme.preview.background"></div>
                        <div class="preview-color surface" [style.background-color]="theme.preview.surface"></div>
                      </div>
                    </div>
                  </mat-radio-button>
                </div>
              }
            </mat-radio-group>
          </div>

          <mat-divider></mat-divider>

          <!-- Dark Themes -->
          <div class="theme-group">
            <h3 class="group-title">
              <mat-icon>dark_mode</mat-icon>
              Dark Themes
            </h3>
            <mat-radio-group [formControl]="themeControl" class="theme-options">
              @for (theme of darkThemes; track theme.id) {
                <div class="theme-option" [class.selected]="themeControl.value === theme.id">
                  <mat-radio-button 
                    [value]="theme.id"
                    class="theme-radio">
                    <div class="theme-info">
                      <span class="theme-name">{{ theme.name }}</span>
                      <div class="theme-preview">
                        <div class="preview-color primary" [style.background-color]="theme.preview.primary"></div>
                        <div class="preview-color secondary" [style.background-color]="theme.preview.secondary"></div>
                        <div class="preview-color tertiary" [style.background-color]="theme.preview.tertiary"></div>
                        <div class="preview-color background" [style.background-color]="theme.preview.background"></div>
                        <div class="preview-color surface" [style.background-color]="theme.preview.surface"></div>
                      </div>
                    </div>
                  </mat-radio-button>
                </div>
              }
            </mat-radio-group>
          </div>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" (click)="onApply()">Apply</button>
      </mat-dialog-actions>
    </div>
  `,
  styleUrls: ['./theme-selector-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemeSelectorDialogComponent {
  protected themeService = inject(ThemeService);
  private dialogRef = inject(MatDialogRef<ThemeSelectorDialogComponent>);

  themeControl = new FormControl(this.themeService.currentThemeId$());

  get lightThemes(): Theme[] {
    return this.themeService.availableThemes.filter(theme => theme.mode === 'light');
  }

  get darkThemes(): Theme[] {
    return this.themeService.availableThemes.filter(theme => theme.mode === 'dark');
  }

  onApply(): void {
    this.themeService.setTheme(this.themeControl.value || '');
    this.dialogRef.close();
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
