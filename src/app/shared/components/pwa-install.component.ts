import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { PwaService } from '../../core/services/pwa.service';

@Component({
  selector: 'app-pwa-install',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  template: `
    <div class="pwa-install-container" *ngIf="showInstallPrompt()">
      <div class="install-card">
        <mat-icon class="install-icon">get_app</mat-icon>
        <h3>Install App</h3>
        <p>Install Project Controls Reporting Tool for a better experience</p>
        <div class="install-actions">
          <button mat-raised-button color="primary" (click)="installApp()">
            <mat-icon>get_app</mat-icon>
            Install
          </button>
          <button mat-button (click)="dismissInstall()">
            <mat-icon>close</mat-icon>
            Not now
          </button>
        </div>
      </div>
    </div>

    <!-- PWA Status Indicator -->
    <div class="pwa-status" *ngIf="isStandalone()">
      <mat-icon class="status-icon">offline_bolt</mat-icon>
      <span>Running as PWA</span>
    </div>
  `,
  styles: [`
    .pwa-install-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
    }

    .install-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      max-width: 300px;
      text-align: center;
    }

    .install-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      color: #1976d2;
      margin-bottom: 16px;
    }

    .install-card h3 {
      margin: 0 0 8px 0;
      color: #333;
    }

    .install-card p {
      margin: 0 0 20px 0;
      color: #666;
      font-size: 14px;
    }

    .install-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .pwa-status {
      position: fixed;
      top: 10px;
      right: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      background: #4caf50;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
    }

    .status-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
    }

    @media (max-width: 768px) {
      .pwa-install-container {
        bottom: 10px;
        right: 10px;
        left: 10px;
      }

      .install-card {
        max-width: none;
      }

      .install-actions {
        flex-direction: column;
      }
    }
  `]
})
export class PwaInstallComponent implements OnInit {
  showInstallPrompt = signal(false);
  private deferredPrompt: any = null;

  constructor(
    private pwaService: PwaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallPrompt.set(true);
    });

    // Hide install prompt if already installed
    window.addEventListener('appinstalled', () => {
      this.showInstallPrompt.set(false);
      this.deferredPrompt = null;
      this.snackBar.open('App installed successfully!', 'Close', {
        duration: 3000
      });
    });
  }

  async installApp(): Promise<void> {
    if (!this.deferredPrompt) {
      this.snackBar.open('Installation not available', 'Close', {
        duration: 3000
      });
      return;
    }

    try {
      // Show the installation prompt
      this.deferredPrompt.prompt();
      
      // Wait for the user's response
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        this.snackBar.open('App installation started...', 'Close', {
          duration: 3000
        });
      } else {
        this.snackBar.open('Installation cancelled', 'Close', {
          duration: 3000
        });
      }

      // Clear the deferred prompt
      this.deferredPrompt = null;
      this.showInstallPrompt.set(false);
    } catch (error) {
      console.error('Error during installation:', error);
      this.snackBar.open('Installation failed', 'Close', {
        duration: 3000
      });
    }
  }

  dismissInstall(): void {
    this.showInstallPrompt.set(false);
    this.deferredPrompt = null;
  }

  isStandalone(): boolean {
    return this.pwaService.isStandalone();
  }
}
