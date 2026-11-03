import { Injectable } from '@angular/core';
import { keycloak } from './keycloak.client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  get isAuthenticated(): boolean {
    return keycloak.authenticated === true;
  }

  get username(): string | null {
    return keycloak.tokenParsed?.['preferred_username'] ?? null;
  }

  hasRole(role: 'ADMIN' | 'CUSTOMER'): boolean {
    return keycloak.realmAccess?.roles?.includes(role) ?? false;
  }

  async login(): Promise<void> {
    await keycloak.login({ redirectUri: window.location.origin });
  }

  async logout(): Promise<void> {
    await keycloak.logout({ redirectUri: window.location.origin });
  }

  async accessToken(): Promise<string | null> {
    if (!keycloak.authenticated) {
      return null;
    }
    try {
      await keycloak.updateToken(30);
      return keycloak.token ?? null;
    } catch {
      return null;
    }
  }
}
