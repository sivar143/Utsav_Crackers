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
      <div class="announcement-bar"><span class="announcement-dot"></span> Celebrate the season with care <span>✦</span> Shop responsibly</div>
      <header class="site-header d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <a class="brand-mark text-decoration-none" href="/" aria-label="Utsav Crackers home"><img src="/assets/utsav-crackers-logo.webp" alt="Utsav Crackers" /><span class="visually-hidden">UTSAV CRACKERS</span></a>
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
            <button class="btn btn-outline-warning btn-sm administrator-button" type="button" (click)="adminLogin()">Administrator</button>
          }
        </div>
      </header>
      <section class="hero rounded-4 p-4 p-md-5" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="eyebrow mb-2">✦ THE FESTIVE COLLECTION</p>
          <h1 id="hero-title" class="display-5 fw-bold mb-3">Make every celebration <span>brighter.</span></h1>
          <p class="lead mb-4">Discover the Utsav collection with transparent pricing and clear fulfilment information.</p>
          <a class="btn hero-cta" href="#catalogue-title">Explore the collection <span aria-hidden="true">→</span></a>
          <div class="hero-trust"><span>✦ Thoughtfully curated</span><span>✦ Clear pricing</span><span>✦ Cash on delivery</span></div>
        </div>
        <div class="hero-art" aria-hidden="true"><span class="hero-orbit orbit-one"></span><span class="hero-orbit orbit-two"></span><span class="hero-star star-one">✦</span><span class="hero-star star-two">✧</span><span class="hero-diya">🪔</span></div>
      </section>
      @if (customerAuthMode()) {
        <div class="screen-backdrop" (click)="closeCustomerAuth()"></div>
        <div class="screen-dialog" role="dialog" aria-modal="true" aria-label="Customer sign in">
          <uc-customer-auth (close)="closeCustomerAuth()" />
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
    .page-shell { position: relative; z-index: 0; }
    .announcement-bar { display:flex; justify-content:center; gap:.65rem; margin:-.5rem 0 1.1rem; padding:.48rem .75rem; border:1px solid rgba(244,207,135,.3); border-radius:999px; color:#ffebc6; background:rgba(54,7,7,.68); font-size:.72rem; text-align:center; }
    .announcement-dot { width:.42rem; height:.42rem; border-radius:50%; background:#f4c46e; box-shadow:0 0 12px #f4c46e; animation:soft-pulse 2.4s ease-in-out infinite; }\n    .site-header { position: relative; z-index: 30; isolation: isolate; min-height: 76px; }\n    .brand-mark { display: inline-flex; align-items: center; position: relative; z-index: 31; }\n    .brand-mark img { display: block; width: clamp(68px, 8vw, 104px); height: clamp(68px, 8vw, 104px); object-fit: contain; }\n    .site-header > div { position: relative; z-index: 32; }\n    .administrator-button { position: relative; z-index: 33; pointer-events: auto; cursor: pointer; font-weight: 700; }
    .account-menu { position: relative; }
    .account-trigger { max-width: min(42vw, 280px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .account-dropdown { position: absolute; z-index: 1100; top: calc(100% + .35rem); right: 0; min-width: 190px; padding: .35rem 0; background: #fff; border: 1px solid #e4e9e5; border-radius: .75rem; box-shadow: 0 .75rem 2rem rgba(0,0,0,.14); }
    .account-identity { border-bottom: 1px solid #edf0ed; overflow-wrap: anywhere; }
    .account-dropdown .dropdown-item { padding: .55rem 1rem; }
    .hero { position:relative; isolation:isolate; overflow:hidden; display:flex; align-items:center; min-height:330px; background:linear-gradient(112deg,rgba(43,5,7,.96),rgba(105,17,17,.92) 62%,rgba(143,75,27,.9)); color:#fff; border:1px solid rgba(229,190,112,.42); box-shadow:0 1.25rem 3rem rgba(35,3,4,.24); animation:rise-in .75s ease both; }
    .hero-copy { position:relative; z-index:2; max-width:660px; }
    .hero h1 { max-width:650px; line-height:1.08; }
    .hero h1 span { color:#ffd47c; }
    .hero-cta { display:inline-flex; gap:.75rem; padding:.78rem 1.15rem; color:#4b170d; background:linear-gradient(135deg,#ffe7a7,#e8b85c); border:1px solid #fff0c6; border-radius:999px; font-weight:700; transition:transform .2s ease,box-shadow .2s ease; }
    .hero-cta:hover { color:#4b170d; transform:translateY(-3px); box-shadow:0 13px 28px rgba(0,0,0,.24); }
    .hero-trust { display:flex; flex-wrap:wrap; gap:.65rem 1.2rem; margin-top:1.65rem; color:rgba(255,239,211,.82); font-size:.76rem; }
    .hero-art { position:absolute; z-index:1; right:4%; top:50%; width:230px; height:230px; transform:translateY(-50%); display:grid; place-items:center; }
    .hero-diya { font-size:6.5rem; filter:drop-shadow(0 0 22px rgba(255,190,74,.65)); animation:diya-float 4s ease-in-out infinite; }
    .hero-orbit { position:absolute; inset:12px; border:1px solid rgba(255,213,128,.38); border-radius:50%; animation:orbit-spin 24s linear infinite; }
    .orbit-two { inset:32px; border-style:dashed; animation-direction:reverse; }
    .hero-star { position:absolute; color:#ffdc8a; animation:twinkle 2.5s ease-in-out infinite; }
    .star-one { top:8px; right:35px; font-size:1.6rem; }.star-two { bottom:28px; left:12px; font-size:2rem; animation-delay:1s; }
    .eyebrow { color: #f2c879; letter-spacing: .18em; font-size: .8rem; font-weight: 700; }
    .screen-backdrop { position: fixed; inset: 0; z-index: 1080; background: rgba(12, 24, 19, .58); backdrop-filter: blur(2px); }
    .screen-dialog { position: fixed; z-index: 1081; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(760px, calc(100vw - 2rem)); max-height: 88vh; overflow-y: auto; background: #fffdf8; border: 1px solid rgba(174,139,76,.24); border-radius: 1rem; padding: 1.25rem; box-shadow: 0 1.5rem 4rem rgba(0,0,0,.24); }
    .admin-dialog { width: min(1200px, calc(100vw - 2rem)); }
    .address-dialog { width: min(1000px, calc(100vw - 2rem)); }
    @keyframes rise-in { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
    @keyframes soft-pulse { 50% { opacity:.45; transform:scale(.78); } }
    @keyframes twinkle { 50% { opacity:.55; transform:scale(.82) rotate(14deg); } }
    @keyframes diya-float { 50% { transform:translateY(-9px); } }
    @media(max-width:700px) { .hero { min-height:300px; } .hero-art { right:-58px; opacity:.28; } .hero-copy { max-width:100%; } .hero h1 { font-size:2.2rem; } .announcement-bar { border-radius:.8rem; font-size:.65rem; } }
    @media(prefers-reduced-motion:reduce) { *,*::before,*::after { animation-duration:.01ms !important; animation-iteration-count:1 !important; transition-duration:.01ms !important; scroll-behavior:auto !important; } }
  `]
})
export class AppComponent {
  readonly auth = inject(AuthService);
  readonly customerAuthMode = signal<'login' | null>(null);
  readonly cartOpen = signal(false);
  readonly addressPanelOpen = signal(false);
  readonly adminPanelOpen = signal(false);
  readonly accountMenuOpen = signal(false);
  readonly addressPanelReturnToCart = signal(false);

  readonly cart = inject(CartService);

  showCustomerLogin(): void { this.customerAuthMode.set('login'); }

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
