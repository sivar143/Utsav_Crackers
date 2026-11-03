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
interface PaymentOrder {
  orderId: string; razorpayOrderId: string; amount: number; currency: string; keyId: string;
  customerName: string; customerEmail: string; customerPhone: string;
}
interface RazorpayCallback {
  razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string;
}
interface RazorpayOptions {
  key: string; amount: number; currency: string; name: string; description: string; order_id: string;
  prefill: { name: string; email: string; contact: string };
  config: { display: { blocks: Record<string, { name: string; instruments: Array<{ method: string }> }>;
    sequence: string[]; preferences: { show_default_blocks: boolean } } };
  handler: (response: RazorpayCallback) => void;
  modal: { ondismiss: () => void };
}
interface RazorpayInstance {
  open(): void;
  on(event: string, handler: (response: unknown) => void): void;
}
declare global { interface Window { Razorpay?: new (options: RazorpayOptions) => RazorpayInstance; } }

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
              <button class="btn btn-success" type="button" [disabled]="!addressEligible() || checkingAddress() || paymentBusy()" (click)="showPaymentOptions.set(true)">Proceed to Payment</button>
            </div>
          </div>
        }
        @if (showPaymentOptions()) {
          <div class="border rounded-3 p-3 mt-3">
            <div class="d-flex justify-content-between align-items-center"><h3 class="h6 mb-0">Choose payment method</h3><button class="btn-close" type="button" aria-label="Close payment options" (click)="showPaymentOptions.set(false)"></button></div>
            <div class="row g-2 mt-2">
              <div class="col-6">
                <label class="payment-choice" [class.selected]="paymentMethod() === 'UPI'">
                  <input type="radio" name="payment-method" value="UPI" [checked]="paymentMethod() === 'UPI'" (change)="paymentMethod.set('UPI')">
                  <span class="fw-semibold">UPI</span><span class="small text-secondary d-block">UPI apps and supported UPI flows</span>
                </label>
              </div>
              <div class="col-6">
                <label class="payment-choice" [class.selected]="paymentMethod() === 'CARD'">
                  <input type="radio" name="payment-method" value="CARD" [checked]="paymentMethod() === 'CARD'" (change)="paymentMethod.set('CARD')">
                  <span class="fw-semibold">Credit / Debit Card</span><span class="small text-secondary d-block">Supported domestic and international cards</span>
                </label>
              </div>
            </div>
            @if (paymentError()) { <div class="alert alert-warning py-2 mt-3 mb-0" role="alert">{{ paymentError() }}</div> }
            @if (paymentMessage()) { <div class="alert alert-success py-2 mt-3 mb-0" role="status">{{ paymentMessage() }}</div> }
            <div class="d-flex justify-content-end mt-3">
              <button class="btn btn-success" type="button" [disabled]="paymentBusy()" (click)="startPayment()">{{ paymentBusy() ? 'Connecting to payment gateway…' : 'Pay securely with Razorpay' }}</button>
            </div>
            <p class="small text-secondary mt-2 mb-0">Your payment is confirmed only after the server verifies it with Razorpay.</p>
          </div>
        }
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
    .payment-choice { display: block; height: 100%; border: 1px solid #dfe7e1; border-radius: .75rem; padding: .8rem; cursor: pointer; }
    .payment-choice.selected { border-color: #198754; background: #eff8f1; }
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
  readonly showPaymentOptions = signal(false);
  readonly paymentMethod = signal<'UPI' | 'CARD'>('UPI');
  readonly paymentBusy = signal(false);
  readonly paymentError = signal('');
  readonly paymentMessage = signal('');

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
    this.paymentError.set('');
    this.paymentMessage.set('');
    this.showPaymentOptions.set(false);
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
    this.showPaymentOptions.set(false);
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

  async startPayment(): Promise<void> {
    if (!this.selectedAddressId() || !this.addressEligible() || this.paymentBusy()) return;
    this.paymentBusy.set(true);
    this.paymentError.set('');
    this.paymentMessage.set('');
    this.http.post<PaymentOrder>('/api/v1/customer/payments/orders', {
      addressId: this.selectedAddressId(), paymentMethod: this.paymentMethod()
    }).subscribe({
      next: order => {
        void this.openRazorpay(order);
      },
      error: error => {
        this.paymentBusy.set(false);
        this.paymentError.set(error?.error?.detail || error?.error?.message ||
          'Unable to start payment. Please check delivery eligibility and stock, then try again.');
      }
    });
  }

  private async openRazorpay(order: PaymentOrder): Promise<void> {
    try {
      await this.loadRazorpayScript();
      if (!window.Razorpay) throw new Error('The secure payment window could not be loaded.');
      const instrument = this.paymentMethod() === 'UPI' ? 'upi' : 'card';
      const options: RazorpayOptions = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Utsav Crackers',
        description: 'Order payment',
        order_id: order.razorpayOrderId,
        prefill: { name: order.customerName, email: order.customerEmail, contact: order.customerPhone },
        config: {
          display: {
            blocks: { selected: { name: this.paymentMethod() === 'UPI' ? 'Pay using UPI' : 'Pay using card', instruments: [{ method: instrument }] } },
            sequence: ['block.selected'],
            preferences: { show_default_blocks: false }
          }
        },
        handler: response => {
          this.http.post<{ status: string; message: string }>('/api/v1/customer/payments/verify', response)
            .subscribe({
              next: result => {
                this.paymentBusy.set(false);
                this.paymentMessage.set(result.message);
                this.cart.load();
              },
              error: error => {
                this.paymentBusy.set(false);
                this.paymentError.set(error?.error?.detail ||
                  'Payment confirmation is pending. If money was deducted, do not pay again; contact support with your payment reference.');
              }
            });
        },
        modal: { ondismiss: () => this.paymentBusy.set(false) }
      };
      const checkout = new window.Razorpay(options);
      checkout.on('payment.failed', response => {
        this.paymentBusy.set(false);
        const details = response as { error?: { description?: string } };
        this.paymentError.set(details?.error?.description || 'Payment failed. You can retry securely.');
      });
      checkout.open();
    } catch (error) {
      this.paymentBusy.set(false);
      this.paymentError.set(error instanceof Error ? error.message : 'Unable to load the payment gateway.');
    }
  }

  private loadRazorpayScript(): Promise<void> {
    if (window.Razorpay) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout]');
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Razorpay checkout could not be loaded.')), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.dataset['razorpayCheckout'] = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Razorpay checkout could not be loaded.'));
      document.head.appendChild(script);
    });
  }
}
