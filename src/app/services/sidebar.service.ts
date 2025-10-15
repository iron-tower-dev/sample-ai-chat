import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private toggleSignal = signal<boolean>(false);

  get toggle() {
    return this.toggleSignal.asReadonly();
  }

  toggleSidebar(): void {
    this.toggleSignal.update(current => !current);
  }
}