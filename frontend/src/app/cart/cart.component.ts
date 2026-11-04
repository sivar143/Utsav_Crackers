import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { CartService } from './cart.service';

interface CheckoutAddress {
  id: string; label: string; recipientName: string; phoneNumber: string; addressLine1: string;
  addressLine2: string | null; city: string; district: string; stateCode: string; postalCode: string;
  defaultAddress: boolean;
}
@Component({
  selector: 'uc-cart',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (opened) {
      <div class="cart-backdrop" role="presentation" (click)="close.emit()"></div>
      <section class="cart-panel" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <div class="d-flex justify-content-end"><button type="button" class="btn-close" aria-label="Close cart" (click)="close.emit()"></button></div>
        @if (!auth.isAuthenticated) {
          <p class="text-secondary">Sign in with your email to view and save your cart.</p>
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
                  <div class="text-secondary small">{{ item.unitPrice | currency:item.currency:'symbol':'1.2-2' }} each</div>
                  <div class="quantity-control mt-2" [attr.aria-label]="'Quantity for ' + item.name">
                    <button class="btn btn-sm btn-outline-secondary" type="button" [disabled]="cart.loading()" [attr.aria-label]="'Decrease quantity of ' + item.name" (click)="decrease(item.productId, item.quantity)">−</button>
                    <span class="quantity-value" aria-live="polite">{{ item.quantity }}</span>
                    <button class="btn btn-sm btn-outline-secondary" type="button" [disabled]="cart.loading() || item.quantity >= 99" [attr.aria-label]="'Increase quantity of ' + item.name" (click)="increase(item.productId, item.quantity)">+</button>
                  </div>
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
        @if (checkoutAddresses().length > 0) {
          <div class="border rounded-3 p-3 mt-3">
            <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
              <strong>Delivery address</strong>
              <button class="btn btn-sm btn-link" type="button" (click)="manageAddresses.emit()">Manage addresses</button>
            </div>
            <select class="form-select" aria-label="Choose delivery address" [value]="selectedAddressId()" (change)="selectAddress($any($event.target).value)">
              @for (address of checkoutAddresses(); track address.id) {
                <option [value]="address.id">{{ address.label }} — {{ address.recipientName }}, {{ address.city }} ({{ address.postalCode }})</option>
              }
            </select>
            @if (addressPolicyMessage()) {
              <div class="small mt-2" [class.text-success]="addressEligible()" [class.text-danger]="!addressEligible()">{{ addressPolicyMessage() }}</div>
            }
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
              <button class="btn btn-outline-secondary btn-sm" type="button" (click)="manageAddresses.emit()">Add or edit address</button>
              <button class="btn btn-success" type="button" [disabled]="!addressEligible() || checkingAddress() || orderBusy()" (click)="placeOrder()">Place order (Cash on Delivery)</button>
            </div>
          </div>
        }
        @if (orderError()) { <div class="alert alert-warning py-2 mt-3" role="alert">{{ orderError() }}</div> }
        @if (orderMessage()) { <div class="alert alert-success py-2 mt-3" role="status">{{ orderMessage() }}</div> }

      }
      </section>
    }
  `,
  styles: [`
    .cart-backdrop { position: fixed; inset: 0; z-index: 1090; background: rgba(12, 24, 19, .58); backdrop-filter: blur(2px); }
    .cart-panel { position: fixed; z-index: 1091; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(680px, calc(100vw - 2rem)); max-height: min(85vh, 820px); overflow-y: auto; background: #fff; border: 1px solid #e4e9e5; border-radius: 1rem; padding: 1.25rem; box-shadow: 0 1.5rem 4rem rgba(0,0,0,.24); }
    .quantity-control { display: inline-flex; align-items: center; gap: .65rem; }
    .quantity-value { min-width: 1.5rem; text-align: center; font-weight: 700; font-variant-numeric: tabular-nums; }
    .cart-eyebrow { color: #8b6a2c; font-size: .72rem; font-weight: 700; letter-spacing: .16em; }
    .cart-lines { display: grid; gap: .75rem; }
    .cart-line { display: flex; justify-content: space-between; align-items: center; gap: 1rem; border-bottom: 1px solid #edf0ed; padding-bottom: .75rem; }
  `]
})
export class CartComponent {
  @Input() opened = false;
  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly requestAddress = new EventEmitter<void>();
  @Output() readonly manageAddresses = new EventEmitter<void>();
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  private readonly http = inject(HttpClient);
  readonly checkoutAddresses = signal<CheckoutAddress[]>([]);
  readonly selectedAddressId = signal('');
  readonly addressEligible = signal(false);
  readonly addressPolicyMessage = signal('');
  readonly checkingAddress = signal(false);
  readonly orderBusy = signal(false);
  readonly orderError = signal('');
  readonly orderMessage = signal('');

  constructor() {
    effect(() => { if (this.auth.isAuthenticated) this.cart.load(); });
  }

  increase(productId: string, quantity: number): void { this.cart.setQuantity(productId, Math.min(99, quantity + 1)); }

  decrease(productId: string, quantity: number): void {
    if (quantity <= 1) this.cart.remove(productId);
    else this.cart.setQuantity(productId, quantity - 1);
  }

  proceedToCheckout(): void {
    this.checkoutAddresses.set([]);
    this.selectedAddressId.set('');
    this.addressEligible.set(false);
    this.addressPolicyMessage.set('');
    this.orderError.set('');
    this.orderMessage.set('');
    this.http.get<CheckoutAddress[]>('/api/v1/customer/addresses').subscribe({
      next: addresses => {
        if (!addresses.length) { this.requestAddress.emit(); return; }
        this.checkoutAddresses.set(addresses);
        const selected = addresses.find(address => address.defaultAddress) ?? addresses[0];
        this.selectAddress(selected.id);
      },
      error: () => this.cart.error.set('Your saved addresses could not be checked. Please sign in again and retry.')
    });
  }

  selectAddress(addressId: string): void {
    this.selectedAddressId.set(addressId);
    this.addressEligible.set(false);
    this.addressPolicyMessage.set('');
    if (!addressId) return;
    this.checkingAddress.set(true);
    this.http.post<{ eligibleForCheckout: boolean; reason: string }>(
      '/api/v1/customer/compliance/eligibility-check', { addressId }
    ).subscribe({
      next: result => {
        this.addressEligible.set(result.eligibleForCheckout);
        this.addressPolicyMessage.set(result.reason);
        this.checkingAddress.set(false);
      },
      error: () => {
        this.addressEligible.set(false);
        this.addressPolicyMessage.set('Delivery eligibility could not be verified. Please retry or contact support.');
        this.checkingAddress.set(false);
      }
    });
  }

  placeOrder(): void {
    if (!this.selectedAddressId() || !this.addressEligible() || this.orderBusy()) return;
    this.orderBusy.set(true);
    this.orderError.set('');
    this.orderMessage.set('');
    this.http.post<{ orderId: string; amount: number; currency: string; paymentMethod: string; message: string }>(
      '/api/v1/customer/orders', { addressId: this.selectedAddressId() }
    ).subscribe({
      next: result => {
        this.orderBusy.set(false);
        this.orderMessage.set(`${result.message} Order reference: ${result.orderId}. Amount payable on delivery: ${result.currency} ${result.amount.toFixed(2)}.`);
        this.cart.load();
        this.checkoutAddresses.set([]);
        this.selectedAddressId.set('');
      },
      error: error => {
        this.orderBusy.set(false);
        this.orderError.set(error?.error?.detail || error?.error?.message ||
          'Unable to place your order. Please check delivery eligibility and stock, then try again.');
      }
    });
  }
}
