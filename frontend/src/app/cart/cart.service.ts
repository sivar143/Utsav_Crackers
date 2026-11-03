import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { CartResponse, EMPTY_CART } from './cart.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);

  readonly cart = signal<CartResponse>(EMPTY_CART);
  readonly loading = signal(false);
  readonly error = signal('');

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.http.get<CartResponse>('/api/v1/customer/cart')
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: cart => this.cart.set(cart),
        error: () => this.error.set('Your cart could not be loaded. Please try again.')
      });
  }

  addOne(productId: string): void {
    const currentQuantity = this.cart().items.find(item => item.productId === productId)?.quantity ?? 0;
    this.setQuantity(productId, currentQuantity + 1);
  }

  setQuantity(productId: string, quantity: number): void {
    this.loading.set(true);
    this.error.set('');
    this.http.put<CartResponse>(`/api/v1/customer/cart/items/${productId}`, { quantity })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: cart => this.cart.set(cart),
        error: () => this.error.set('The item could not be added. Please refresh your cart and try again.')
      });
  }

  remove(productId: string): void {
    this.loading.set(true);
    this.error.set('');
    this.http.delete<CartResponse>(`/api/v1/customer/cart/items/${productId}`)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: cart => this.cart.set(cart),
        error: () => this.error.set('The item could not be removed. Please try again.')
      });
  }

  clear(): void {
    this.loading.set(true);
    this.error.set('');
    this.http.delete<CartResponse>('/api/v1/customer/cart')
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: cart => this.cart.set(cart),
        error: () => this.error.set('Your cart could not be cleared. Please try again.')
      });
  }
}
