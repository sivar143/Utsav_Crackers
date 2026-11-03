import { Component, inject, signal } from '@angular/core';
import { ProductCatalogueComponent } from './catalogue/product-catalogue.component';
import { CartComponent } from './cart/cart.component';
import { CartService } from './cart/cart.service';
import { CustomerAddressComponent } from './customer-address/customer-address.component';
import { CatalogueAdminComponent } from './admin/catalogue-admin.component';
import { InventoryAdminComponent } from './inventory/inventory-admin.component';
import { ComplianceAdminComponent } from './compliance/compliance-admin.component';
import { AuthService } from './auth/auth.service';
import { CustomerAuthComponent } from './auth/customer-auth.component';
import { DeliveryAdminComponent } from './admin/delivery-admin.component';

@Component({
  selector: 'uc-root',
  standalone: true,
  imports: [ProductCatalogueComponent, CartComponent, CustomerAddressComponent, CatalogueAdminComponent,
    InventoryAdminComponent, ComplianceAdminComponent, CustomerAuthComponent, DeliveryAdminComponent],
  template: `
    <main class="page-shell container py-4 py-md-5">
      <header class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <a class="brand-mark text-decoration-none" href="/" aria-label="Utsav Crackers home">UTSAV CRACKERS</a>
        <div class="d-flex align-items-center gap-2">
          @if (!auth.hasRole('ADMIN')) {
          <button class="btn btn-outline-success btn-sm position-relative" type="button" aria-label="Open shopping cart" (click)="cartOpen.set(true)">
            <span aria-hidden="true">🛒</span>
            @if (cart.cart().totalQuantity > 0) { <span class="badge rounded-pill text-bg-success ms-1">{{ cart.cart().totalQuantity }}</span> }
          </button>
          }
          @if (auth.hasRole('ADMIN')) {
            <button class="btn btn-outline-success btn-sm" type="button" (click)="adminPanelOpen.set(true)">Admin panel</button>
          }
          @if (auth.isAuthenticated) {
            <div class="account-menu" (mouseenter)="accountMenuOpen.set(true)" (mouseleave)="accountMenuOpen.set(false)" (focusin)="accountMenuOpen.set(true)" (focusout)="closeAccountMenu($event)">
              <button class="btn btn-outline-secondary btn-sm account-trigger" type="button" aria-haspopup="true"
                [attr.aria-expanded]="accountMenuOpen()" (click)="openAccountMenu()">
                {{ auth.accountLabel || 'My account' }} <span aria-hidden="true">▾</span>
              </button>
              @if (accountMenuOpen()) {
                <div class="account-dropdown" role="menu">
                  <div class="account-identity small text-secondary px-3 py-2">{{ auth.accountLabel || 'Signed-in account' }}</div>
                  @if (auth.hasRole('CUSTOMER') && !auth.hasRole('ADMIN')) {
                    <button class="dropdown-item" type="button" role="menuitem" (click)="openAddressPanel()">My addresses</button>
                  }
                  <button class="dropdown-item" type="button" role="menuitem" (click)="logout()">Sign out</button>
                </div>
              }
            </div>
          } @else {
            <button class="btn btn-outline-success btn-sm" type="button" (click)="showCustomerLogin()">Sign in</button>
            <button class="btn btn-success btn-sm" type="button" (click)="showCustomerRegistration()">Sign up</button>
            <button class="btn btn-link btn-sm text-secondary" type="button" (click)="adminLogin()">Administrator</button>
          }
        </div>
      </header>
      <section class="hero rounded-4 p-4 p-md-5">
        <p class="eyebrow mb-2">CELEBRATE RESPONSIBLY</p>
        <h1 class="display-5 fw-bold mb-3">Celebrate with care.</h1>
        <p class="lead mb-0">Discover products with transparent pricing and clear fulfilment information.</p>
      </section>
      @if (customerAuthMode(); as authMode) {
        <div class="screen-backdrop" (click)="closeCustomerAuth()"></div>
        <div class="screen-dialog" role="dialog" aria-modal="true" aria-label="Customer sign in">
          <uc-customer-auth [initialMode]="authMode" (close)="closeCustomerAuth()" />
        </div>
      }
      @if (adminPanelOpen() && auth.hasRole('ADMIN')) {
        <div class="screen-backdrop" (click)="adminPanelOpen.set(false)"></div>
        <section class="screen-dialog admin-dialog" role="dialog" aria-modal="true" aria-label="Administrator workspace">
          <div class="d-flex justify-content-between align-items-center mb-3"><h2 class="h4 mb-0">Administrator workspace</h2><button class="btn-close" type="button" aria-label="Close administrator workspace" (click)="adminPanelOpen.set(false)"></button></div>
          <uc-catalogue-admin />
          <uc-inventory-admin />
          <uc-compliance-admin />
          <uc-delivery-admin />
        </section>
      }
      <uc-cart [opened]="cartOpen()" (close)="cartOpen.set(false)" (requestAddress)="openAddressPanel(true)" (manageAddresses)="openAddressPanel(true)" />
      @if (addressPanelOpen() && auth.hasRole('CUSTOMER') && !auth.hasRole('ADMIN')) {
        <div class="screen-backdrop" (click)="closeAddressPanel()"></div>
        <section class="screen-dialog address-dialog" role="dialog" aria-modal="true" aria-label="My addresses">
          <div class="d-flex justify-content-between align-items-center mb-2"><h2 class="h4 mb-0">My addresses</h2><button class="btn-close" type="button" aria-label="Close address screen" (click)="addressPanelOpen.set(false)"></button></div>
          <uc-address-book (saved)="onAddressSaved()" />
        </section>
      }
      <uc-product-catalogue (requestSignIn)="showCustomerLogin()" />
      <section class="border-top pt-3 text-secondary small">
        Product availability and delivery eligibility will be confirmed before checkout.
      </section>
    </main>
  `,
  styles: [`
    .page-shell { position: relative; z-index: 0; }\n    .brand-mark { color: #17372b; font-size: .9rem; font-weight: 800; letter-spacing: .14em; }
    .account-menu { position: relative; }
    .account-trigger { max-width: min(42vw, 280px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .account-dropdown { position: absolute; z-index: 1100; top: calc(100% + .35rem); right: 0; min-width: 190px; padding: .35rem 0; background: #fff; border: 1px solid #e4e9e5; border-radius: .75rem; box-shadow: 0 .75rem 2rem rgba(0,0,0,.14); }
    .account-identity { border-bottom: 1px solid #edf0ed; overflow-wrap: anywhere; }
    .account-dropdown .dropdown-item { padding: .55rem 1rem; }
    .hero { background: linear-gradient(118deg, #163a2d 0%, #20513d 58%, #8a642d 140%); color: #fff; border: 1px solid rgba(229,190,112,.35); box-shadow: 0 1rem 2.5rem rgba(36,65,48,.12); }
    .eyebrow { color: #f2c879; letter-spacing: .18em; font-size: .8rem; font-weight: 700; }
    .screen-backdrop { position: fixed; inset: 0; z-index: 1080; background: rgba(12, 24, 19, .58); backdrop-filter: blur(2px); }
    .screen-dialog { position: fixed; z-index: 1081; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(760px, calc(100vw - 2rem)); max-height: 88vh; overflow-y: auto; background: #fffdf8; border: 1px solid rgba(174,139,76,.24); border-radius: 1rem; padding: 1.25rem; box-shadow: 0 1.5rem 4rem rgba(0,0,0,.24); }
    .admin-dialog { width: min(1200px, calc(100vw - 2rem)); }
    .address-dialog { width: min(1000px, calc(100vw - 2rem)); }
  `]
})
export class AppComponent {
  readonly auth = inject(AuthService);
  readonly customerAuthMode = signal<'login' | 'register' | null>(null);
  readonly cartOpen = signal(false);
  readonly addressPanelOpen = signal(false);
  readonly adminPanelOpen = signal(false);
  readonly accountMenuOpen = signal(false);
  readonly addressPanelReturnToCart = signal(false);

  readonly cart = inject(CartService);

  showCustomerLogin(): void { this.customerAuthMode.set('login'); }

  showCustomerRegistration(): void { this.customerAuthMode.set('register'); }

  openAccountMenu(): void { this.accountMenuOpen.set(true); }

  openAddressPanel(returnToCart = false): void {
    this.accountMenuOpen.set(false);
    this.cartOpen.set(false);
    this.addressPanelReturnToCart.set(returnToCart);
    this.addressPanelOpen.set(true);
  }

  closeAccountMenu(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!(event.currentTarget as HTMLElement).contains(next)) this.accountMenuOpen.set(false);
  }

  closeAddressPanel(): void {
    this.addressPanelOpen.set(false);
    if (this.addressPanelReturnToCart()) this.cartOpen.set(true);
    this.addressPanelReturnToCart.set(false);
  }

  onAddressSaved(): void {
    if (this.addressPanelReturnToCart()) this.closeAddressPanel();
  }

  closeCustomerAuth(): void { this.customerAuthMode.set(null); }

  adminLogin(): void {
    void this.auth.login();
  }

  logout(): void {
    this.accountMenuOpen.set(false);
    void this.auth.logout();
  }
}
