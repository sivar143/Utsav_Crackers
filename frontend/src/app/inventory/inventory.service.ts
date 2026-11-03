import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventoryBalance, InventoryMovement } from './inventory.model';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/v1/admin/inventory';

  listBalances(): Observable<InventoryBalance[]> {
    return this.http.get<InventoryBalance[]>(this.endpoint);
  }

  adjust(productId: string, quantityDelta: number, reason: string): Observable<InventoryBalance> {
    return this.http.post<InventoryBalance>(`${this.endpoint}/${productId}/adjustments`, {
      quantityDelta,
      reason
    });
  }

  listMovements(productId: string): Observable<InventoryMovement[]> {
    return this.http.get<InventoryMovement[]>(`${this.endpoint}/${productId}/movements`);
  }
}
