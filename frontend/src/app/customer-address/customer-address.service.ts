import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CustomerAddress, CustomerAddressRequest } from './customer-address.model';

@Injectable({ providedIn: 'root' })
export class CustomerAddressService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/v1/customer/addresses';

  list(): Observable<CustomerAddress[]> {
    return this.http.get<CustomerAddress[]>(this.endpoint);
  }

  create(request: CustomerAddressRequest): Observable<CustomerAddress> {
    return this.http.post<CustomerAddress>(this.endpoint, request);
  }

  update(id: string, request: CustomerAddressRequest): Observable<CustomerAddress> {
    return this.http.put<CustomerAddress>(`${this.endpoint}/${id}`, request);
  }

  makeDefault(id: string): Observable<CustomerAddress> {
    return this.http.put<CustomerAddress>(`${this.endpoint}/${id}/default`, {});
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
