import { Routes } from '@angular/router';
import { ChatLayoutComponent } from './components/chat-layout/chat-layout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/chat',
    pathMatch: 'full'
  },
  {
    path: 'chat',
    component: ChatLayoutComponent
  }
];
