import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { keycloak } from './keycloak.client';

interface TokenRefreshResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly customerAccessToken = signal<string | null>(null);
  private readonly customerRefreshToken = signal<string | null>(null);
  private readonly customerExpiresAt = signal(0);
  private readonly customerRoles = signal<string[]>([]);
  // Bypass the bearer interceptor for refresh calls to prevent recursive token refresh.
  private readonly rawHttp = new HttpClient(inject(HttpBackend));
  private refreshInFlight: Promise<string | null> | null = null;

  get isAuthenticated(): boolean {
    return !!this.customerAccessToken() || keycloak.authenticated === true;
  }

  get username(): string | null {
    if (this.customerAccessToken()) return this.customerClaim('preferred_username') ?? this.customerClaim('email');
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

  setCustomerSession(accessToken: string, refreshToken: string, expiresIn: number): void {
    this.customerAccessToken.set(accessToken);
    this.customerRefreshToken.set(refreshToken);
    this.customerExpiresAt.set(Date.now() + Math.max(0, expiresIn) * 1000);
    const payload = this.decodeToken(accessToken);
    const roles = (payload?.['realm_access'] as { roles?: string[] } | undefined)?.roles ?? [];
    this.customerRoles.set(roles);
  }

  clearCustomerSession(): void {
    this.customerAccessToken.set(null);
    this.customerRefreshToken.set(null);
    this.customerExpiresAt.set(0);
    this.customerRoles.set([]);
  }

  async accessToken(): Promise<string | null> {
    const customerToken = this.customerAccessToken();
    if (customerToken) {
      if (Date.now() < this.customerExpiresAt() - 30_000) return customerToken;
      return this.refreshCustomerSession();
    }
    if (!keycloak.authenticated) return null;
    try {
      await keycloak.updateToken(30);
      return keycloak.token ?? null;
    } catch {
      return null;
    }
  }

  private async refreshCustomerSession(): Promise<string | null> {
    if (this.refreshInFlight) return this.refreshInFlight;
    const refreshToken = this.customerRefreshToken();
    if (!refreshToken) {
      this.clearCustomerSession();
      return null;
    }
    this.refreshInFlight = firstValueFrom(this.rawHttp.post<TokenRefreshResponse>(
      '/api/v1/auth/customer/refresh', { refreshToken }
    )).then(response => {
      this.setCustomerSession(response.access_token, response.refresh_token ?? refreshToken, response.expires_in);
      return response.access_token;
    }).catch(() => {
      this.clearCustomerSession();
      return null;
    }).finally(() => {
      this.refreshInFlight = null;
    });
    return this.refreshInFlight;
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
