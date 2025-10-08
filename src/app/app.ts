import { Component, signal } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChatInterfaceComponent } from './components/chat-interface/chat-interface.component';
import { ConversationSidebarComponent } from './components/conversation-sidebar/conversation-sidebar.component';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-root',
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    ChatInterfaceComponent,
    ConversationSidebarComponent,
    ThemeToggleComponent
  ],
  template: `
    <div class="app-layout">
      <!-- Global App Toolbar -->
      <mat-toolbar class="app-toolbar" color="primary">
        <button 
          mat-icon-button 
          (click)="sidenav.toggle()"
          matTooltip="Toggle Sidebar"
          class="menu-toggle">
          <mat-icon>menu</mat-icon>
        </button>
        
        <span class="app-title">{{ title() }}</span>
        
        <span class="toolbar-spacer"></span>
        
        <!-- Future navigation items -->
        <button 
          mat-icon-button 
          [matMenuTriggerFor]="appMenu"
          matTooltip="Application Menu">
          <mat-icon>apps</mat-icon>
        </button>
        
        <mat-menu #appMenu="matMenu">
          <button mat-menu-item disabled>
            <mat-icon>dashboard</mat-icon>
            <span>Dashboard</span>
          </button>
          <button mat-menu-item disabled>
            <mat-icon>admin_panel_settings</mat-icon>
            <span>Admin</span>
          </button>
          <button mat-menu-item disabled>
            <mat-icon>settings</mat-icon>
            <span>Settings</span>
          </button>
        </mat-menu>
        
        <app-theme-toggle></app-theme-toggle>
        
        <button 
          mat-icon-button 
          matTooltip="User Profile">
          <mat-icon>account_circle</mat-icon>
        </button>
      </mat-toolbar>
      
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
  protected readonly title = signal('AI Chat Assistant');
}
