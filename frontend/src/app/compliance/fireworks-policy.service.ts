import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FireworksPolicy, FireworksPolicyRequest } from './fireworks-policy.model';

@Injectable({ providedIn: 'root' })
export class FireworksPolicyService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/v1/admin/compliance/policies';

  list(): Observable<FireworksPolicy[]> {
    return this.http.get<FireworksPolicy[]>(this.endpoint);
  }

  create(request: FireworksPolicyRequest): Observable<FireworksPolicy> {
    return this.http.post<FireworksPolicy>(this.endpoint, request);
  }

  approve(id: string): Observable<FireworksPolicy> {
    return this.http.put<FireworksPolicy>(`${this.endpoint}/${id}/approve`, {});
  }

  revoke(id: string, reason: string): Observable<FireworksPolicy> {
    return this.http.put<FireworksPolicy>(`${this.endpoint}/${id}/revoke`, { reason });
  }
}
