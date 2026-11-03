import { Injectable, signal } from '@angular/core';
import { keycloak } from './keycloak.client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly customerAccessToken = signal<string | null>(null);
  private readonly customerRoles = signal<string[]>([]);

  get isAuthenticated(): boolean {
    return !!this.customerAccessToken() || keycloak.authenticated === true;
  }

  get username(): string | null {
    if (this.customerAccessToken()) return this.customerUsername();
    return keycloak.tokenParsed?.['preferred_username'] ?? null;
  }

  get subject(): string | null {
    if (this.customerAccessToken()) return this.customerClaim('sub');
    return keycloak.tokenParsed?.sub ?? null;
  }

  hasRole(role: 'ADMIN' | 'CUSTOMER'): boolean {
    if (this.customerAccessToken()) return this.customerRoles().includes(role);
    return keycloak.realmAccess?.roles?.includes(role) ?? false;
  }

  async login(): Promise<void> {
    // This redirect is reserved for administrators. Customers use the branded form.
    await keycloak.login({ redirectUri: window.location.origin });
  }

  async logout(): Promise<void> {
    if (this.customerAccessToken()) {
      this.clearCustomerSession();
      window.location.assign(window.location.origin);
      return;
    }
    await keycloak.logout({ redirectUri: window.location.origin });
  }

  setCustomerSession(accessToken: string): void {
    this.customerAccessToken.set(accessToken);
    const payload = this.decodeToken(accessToken);
    const roles = (payload?.['realm_access'] as { roles?: string[] } | undefined)?.roles ?? [];
    this.customerRoles.set(roles);
  }

  clearCustomerSession(): void {
    this.customerAccessToken.set(null);
    this.customerRoles.set([]);
  }

  async accessToken(): Promise<string | null> {
    const customerToken = this.customerAccessToken();
    if (customerToken) return customerToken;
    if (!keycloak.authenticated) return null;
    try {
      await keycloak.updateToken(30);
      return keycloak.token ?? null;
    } catch {
      return null;
    }
  }

  private customerUsername(): string | null {
    return this.customerClaim('preferred_username') ?? this.customerClaim('email');
  }

  private customerClaim(name: string): string | null {
    return this.decodeToken(this.customerAccessToken() ?? '')?.[name] as string | null ?? null;
  }

  private decodeToken(token: string): Record<string, unknown> | null {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
