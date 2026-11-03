import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { authInterceptor } from './app/auth/auth.interceptor';
import { keycloak } from './app/auth/keycloak.client';

const bootstrap = () => bootstrapApplication(AppComponent, {
  providers: [
    provideRouter([]),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
});

void keycloak.init({
  onLoad: 'check-sso',
  pkceMethod: 'S256',
  checkLoginIframe: false
}).catch((error: unknown) => {
  // Keep the public catalogue usable while the local identity provider is unavailable.
  console.warn('Keycloak initialization was unavailable; continuing as a guest.', error);
}).then(() => bootstrap()).catch((error: unknown) => {
  console.error('Application bootstrap failed', error);
});
