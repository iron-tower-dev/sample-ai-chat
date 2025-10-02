import { Component, signal } from '@angular/core';
import { ChatInterfaceComponent } from './components/chat-interface/chat-interface.component';
import { ConversationSidebarComponent } from './components/conversation-sidebar/conversation-sidebar.component';

@Component({
  selector: 'app-root',
  imports: [ChatInterfaceComponent, ConversationSidebarComponent],
  template: `
    <div class="app-container">
      <app-conversation-sidebar></app-conversation-sidebar>
      <main class="main-content">
        <app-chat-interface></app-chat-interface>
      </main>
    </div>
  `,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('AI Chat Assistant');
}
