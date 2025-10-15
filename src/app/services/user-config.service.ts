import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class UserConfigService {
    private userId = signal<string>('user123');
    private adGroup = signal<string>('nuclear_engineers');

    get userId$() { return this.userId.asReadonly(); }
    get adGroup$() { return this.adGroup.asReadonly(); }

    setUserId(userId: string): void {
        this.userId.set(userId);
        localStorage.setItem('user_id', userId);
    }

    setAdGroup(adGroup: string): void {
        this.adGroup.set(adGroup);
        localStorage.setItem('ad_group', adGroup);
    }

    constructor() {
        this.loadFromStorage();
    }

    private loadFromStorage(): void {
        const storedUserId = localStorage.getItem('user_id');
        const storedAdGroup = localStorage.getItem('ad_group');

        if (storedUserId) {
            this.userId.set(storedUserId);
        }
        if (storedAdGroup) {
            this.adGroup.set(storedAdGroup);
        }
    }
}
