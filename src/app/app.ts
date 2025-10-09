import { Component, signal, ViewChild, inject } from '@angular/core';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatDialog } from '@angular/material/dialog';
import { ChatInterfaceComponent } from './components/chat-interface/chat-interface.component';
import { ConversationSidebarComponent } from './components/conversation-sidebar/conversation-sidebar.component';
import { AppToolbarComponent } from './components/app-toolbar/app-toolbar.component';
import { ThemeSelectorDialogComponent } from './components/theme-selector-dialog/theme-selector-dialog.component';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [
    MatSidenavModule,
    ChatInterfaceComponent,
    ConversationSidebarComponent,
    AppToolbarComponent
  ],
  template: `
    <div class="app-layout">
      <!-- Global App Toolbar -->
      <app-app-toolbar 
        [title]="title()"
        (toggleSidebar)="sidenav.toggle()"
        (openThemeSelector)="openThemeSelector()">
      </app-app-toolbar>
      
      <!-- Main Content Area -->
      <mat-sidenav-container class="app-container">
        <mat-sidenav 
          #sidenav
          mode="side"
          opened
          class="app-sidenav">
          <app-conversation-sidebar></app-conversation-sidebar>
        </mat-sidenav>
        
        <mat-sidenav-content class="app-content">
          <div class="content-wrapper" style="display: flex; flex-direction: column; height: 100%; overflow: hidden;">
            <app-chat-interface></app-chat-interface>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styleUrl: './app.css'
})
export class App {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  private dialog = inject(MatDialog);
  private themeService = inject(ThemeService); // Ensure theme service is initialized

  protected readonly title = signal('AI Chat Assistant');

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
