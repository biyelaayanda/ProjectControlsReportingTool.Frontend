import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .then(() => {
    // Initialize PWA capabilities
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('PWA Service Worker registered:', registration);
        })
        .catch(error => {
          console.error('PWA Service Worker registration failed:', error);
        });
    }
  })
  .catch((err) => console.error(err));
