import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { CartService } from './cart.service';

@Component({
  selector: 'uc-cart',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (opened) {
      <section class="cart-panel" aria-labelledby="cart-title">
        <div class="d-flex justify-content-end"><button type="button" class="btn-close" aria-label="Close cart" (click)="close.emit()"></button></div>
        @if (!auth.isAuthenticated) {
          <p class="text-secondary">Sign in with your email or phone number to view and save your cart.</p>
        } @else {
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
            <span class="fs-5 fw-bold">{{ cart.cart().subtotal | currency:(cart.cart().currency ?? 'INR'):'symbol':'1.2-2' }}</span>
          </div>
          <p class="small text-secondary mt-2 mb-0">Final price, stock, legal eligibility and delivery options are checked again before checkout.</p>
          <div class="d-flex justify-content-end mt-4"><button class="btn btn-success" type="button" [disabled]="cart.loading()" (click)="proceedToCheckout()">Proceed to checkout</button></div>
        }
        @if (checkoutAddress()) {
          <div class="alert alert-success mt-3 mb-0"><strong>Delivery address selected:</strong><br>{{ checkoutAddress() }}<p class="small mb-0 mt-2">Address is ready. Order review and payment will follow once checkout/order processing is enabled.</p></div>
        }
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
export class CartComponent {
  @Input() opened = false;
  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly requestAddress = new EventEmitter<void>();
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  private readonly http = inject(HttpClient);
  readonly checkoutAddress = signal('');

  constructor() {
    effect(() => { if (this.auth.isAuthenticated) this.cart.load(); });
  }

  proceedToCheckout(): void {
    this.checkoutAddress.set('');
    this.http.get<Array<{id:string;label:string;recipientName:string;addressLine1:string;city:string;postalCode:string;defaultAddress:boolean}>>('/api/v1/customer/addresses')
      .subscribe({
        next: addresses => {
          if (!addresses.length) { this.requestAddress.emit(); return; }
          const selected = addresses.find(address => address.defaultAddress) ?? addresses[0];
          this.checkoutAddress.set(`${selected.label}: ${selected.recipientName}, ${selected.addressLine1}, ${selected.city} – ${selected.postalCode}`);
        },
        error: () => this.cart.error.set('Your saved addresses could not be checked. Please sign in again and retry.')
      });
  }
}
