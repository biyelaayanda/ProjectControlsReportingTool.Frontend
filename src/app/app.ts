import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaInstallComponent } from './shared/components/pwa-install.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PwaInstallComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Project Controls Reporting Tool');
}
