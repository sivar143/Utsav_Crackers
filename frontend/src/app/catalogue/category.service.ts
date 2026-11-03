import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from './category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);

  listActive(): Observable<Category[]> {
    return this.http.get<Category[]>('/api/v1/categories');
  }

  create(name: string, slug: string): Observable<Category> {
    return this.http.post<Category>('/api/v1/admin/categories', { name, slug });
  }
}
