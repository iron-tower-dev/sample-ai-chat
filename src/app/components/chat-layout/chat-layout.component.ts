import { Component, ViewChild, inject, effect, ChangeDetectionStrategy } from '@angular/core';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { ChatInterfaceComponent } from '../chat-interface/chat-interface.component';
import { ConversationSidebarComponent } from '../conversation-sidebar/conversation-sidebar.component';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-chat-layout',
  imports: [
    MatSidenavModule,
    ChatInterfaceComponent,
    ConversationSidebarComponent
  ],
  template: `
    <mat-sidenav-container class="chat-container">
      <mat-sidenav 
        #sidenav
        mode="side"
        opened
        class="chat-sidenav">
        <app-conversation-sidebar></app-conversation-sidebar>
      </mat-sidenav>
      
      <mat-sidenav-content class="chat-content">
        <div class="content-wrapper" style="display: flex; flex-direction: column; height: 100%; overflow: hidden;">
          <app-chat-interface></app-chat-interface>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
    }
    
    .chat-container {
      height: 100%;
      width: 100%;
      flex: 1;
    }
    
    .chat-sidenav {
      width: 300px;
      border-right: 1px solid var(--mat-outline-variant);
    }
    
    .chat-content {
      height: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatLayoutComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  private sidebarService = inject(SidebarService);
  private lastToggleValue = false;

  constructor() {
    // Listen to sidebar toggle events from the toolbar
    effect(() => {
      const toggleValue = this.sidebarService.toggle();
      // Only toggle if the value actually changed
      if (toggleValue !== this.lastToggleValue && this.sidenav) {
        this.lastToggleValue = toggleValue;
        this.sidenav.toggle();
      }
    });
  }
}
