import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private swRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.initializePwa();
  }

  private async initializePwa(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', this.swRegistration);
        
        // Listen for service worker updates
        this.swRegistration.addEventListener('updatefound', () => {
          console.log('New service worker version available');
          // You can show a notification to user about update
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Check if app can be installed
  canInstall(): boolean {
    return 'beforeinstallprompt' in window;
  }

  // Trigger PWA install prompt
  async installApp(): Promise<boolean> {
    if (!this.canInstall()) {
      return false;
    }

    try {
      // This would be triggered by the beforeinstallprompt event
      // For now, just return true as implementation depends on event handling
      return true;
    } catch (error) {
      console.error('Error installing PWA:', error);
      return false;
    }
  }

  // Check if app is running in standalone mode
  isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone ||
           document.referrer.includes('android-app://');
  }

  // Get service worker registration
  getRegistration(): ServiceWorkerRegistration | null {
    return this.swRegistration;
  }

  // Update service worker
  async updateServiceWorker(): Promise<void> {
    if (this.swRegistration) {
      await this.swRegistration.update();
    }
  }
}
