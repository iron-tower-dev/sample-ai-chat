import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-app-toolbar',
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule
  ],
  template: `
    <mat-toolbar class="app-toolbar" color="primary">
      <button 
        mat-icon-button 
        (click)="toggleSidebar.emit()"
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
      
      <button 
        mat-icon-button 
        [matMenuTriggerFor]="userMenu"
        matTooltip="User Profile">
        <mat-icon>account_circle</mat-icon>
      </button>
      
      <mat-menu #userMenu="matMenu">
        <button mat-menu-item (click)="openThemeSelector.emit()">
          <mat-icon>palette</mat-icon>
          <span>Theme Settings</span>
        </button>
        <button mat-menu-item (click)="onProfileClick()">
          <mat-icon>person</mat-icon>
          <span>Profile</span>
        </button>
        <button mat-menu-item (click)="onSignOutClick()">
          <mat-icon>logout</mat-icon>
          <span>Sign Out</span>
        </button>
      </mat-menu>
    </mat-toolbar>
  `,
  styleUrls: ['./app-toolbar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppToolbarComponent {
  title = input.required<string>();

  toggleSidebar = output<void>();
  openThemeSelector = output<void>();

  onProfileClick(): void {
    console.log('Profile clicked');
    // TODO: Implement profile functionality
  }

  onSignOutClick(): void {
    console.log('Sign out clicked');
    // TODO: Implement sign out functionality
  }
}
