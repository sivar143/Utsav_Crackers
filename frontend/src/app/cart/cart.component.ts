import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { CartService } from './cart.service';

@Component({
  selector: 'uc-cart',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (auth.isAuthenticated) {
      <section class="cart-panel" aria-labelledby="cart-title">
        <div class="d-flex justify-content-between align-items-center gap-3 mb-3">
          <div>
            <p class="cart-eyebrow mb-1">YOUR SELECTION</p>
            <h2 id="cart-title" class="h4 mb-0">Shopping cart <span class="text-secondary fs-6">({{ cart.cart().totalQuantity }})</span></h2>
          </div>
          @if (cart.cart().items.length > 0) {
            <button class="btn btn-sm btn-link text-secondary" type="button" [disabled]="cart.loading()" (click)="cart.clear()">Clear cart</button>
          }
        </div>

        @if (cart.error()) {
          <div class="alert alert-warning py-2" role="alert">{{ cart.error() }}</div>
        }

        @if (cart.loading() && cart.cart().items.length === 0) {
          <p class="text-secondary small mb-0" role="status">Loading your cart…</p>
        } @else if (cart.cart().items.length === 0) {
          <p class="text-secondary mb-0">Your cart is empty. Add products from the collection below.</p>
        } @else {
          <div class="cart-lines">
            @for (item of cart.cart().items; track item.productId) {
              <div class="cart-line">
                <div class="flex-grow-1">
                  <div class="fw-semibold">{{ item.name }}</div>
                  <div class="text-secondary small">{{ item.quantity }} × {{ item.unitPrice | currency:item.currency:'symbol':'1.2-2' }}</div>
                </div>
                <div class="text-end">
                  <div class="fw-semibold">{{ item.lineTotal | currency:item.currency:'symbol':'1.2-2' }}</div>
                  <button class="btn btn-sm btn-link p-0 text-secondary" type="button" [disabled]="cart.loading()" (click)="cart.remove(item.productId)">Remove</button>
                </div>
              </div>
            }
          </div>
          <div class="d-flex justify-content-between align-items-center border-top pt-3 mt-3">
            <span class="fw-semibold">Subtotal</span>
            <span class="fs-5 fw-bold">{{ cart.cart().subtotal | currency:cart.cart().currency:'symbol':'1.2-2' }}</span>
          </div>
          <p class="small text-secondary mt-2 mb-0">Final price, stock, legal eligibility and delivery options are checked again before checkout.</p>
        }
      </section>
    }
  `,
  styles: [`
    .cart-panel { background: #fff; border: 1px solid #e4e9e5; border-radius: 1rem; padding: 1.25rem; margin: 1.5rem 0; }
    .cart-eyebrow { color: #8b6a2c; font-size: .72rem; font-weight: 700; letter-spacing: .16em; }
    .cart-lines { display: grid; gap: .75rem; }
    .cart-line { display: flex; justify-content: space-between; align-items: center; gap: 1rem; border-bottom: 1px solid #edf0ed; padding-bottom: .75rem; }
  `]
})
export class CartComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);

  ngOnInit(): void {
    if (this.auth.isAuthenticated) {
      this.cart.load();
    }
  }
}
