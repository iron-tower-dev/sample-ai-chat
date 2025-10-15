import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AppToolbarComponent } from './components/app-toolbar/app-toolbar.component';
import { ThemeSelectorDialogComponent } from './components/theme-selector-dialog/theme-selector-dialog.component';
import { ThemeService } from './services/theme.service';
import { SidebarService } from './services/sidebar.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    AppToolbarComponent
  ],
  template: `
    <div class="app-layout">
      <!-- Global App Toolbar -->
      <app-app-toolbar 
        [title]="title()"
        (toggleSidebar)="onToggleSidebar()"
        (openThemeSelector)="openThemeSelector()">
      </app-app-toolbar>
      
      <!-- Router Content -->
      <div class="app-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styleUrl: './app.css'
})
export class App {
  private dialog = inject(MatDialog);
  private themeService = inject(ThemeService); // Ensure theme service is initialized
  private sidebarService = inject(SidebarService);

  protected readonly title = signal('AI Chat Assistant');

  onToggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  openThemeSelector(): void {
    this.dialog.open(ThemeSelectorDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      maxHeight: '80vh',
      disableClose: false,
      autoFocus: false,
      hasBackdrop: true,
      backdropClass: 'theme-dialog-backdrop'
    });
  }
}
