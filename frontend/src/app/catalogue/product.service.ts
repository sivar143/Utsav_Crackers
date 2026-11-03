import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from './product.model';

export interface ProductUpsertRequest {
  sku: string;
  name: string;
  description: string | null;
  categoryId: string;
  price: number;
  currency: string;
  imageData?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);

  listActive(): Observable<Product[]> {
    return this.http.get<Product[]>('/api/v1/products');
  }

  create(request: ProductUpsertRequest): Observable<Product> {
    return this.http.post<Product>('/api/v1/admin/products', request);
  }

  update(id: string, request: ProductUpsertRequest): Observable<Product> {
    return this.http.put<Product>(`/api/v1/admin/products/${id}`, request);
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/admin/products/${id}`);
  }
}
