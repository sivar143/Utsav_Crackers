import { Component, inject } from '@angular/core';
import { ProductCatalogueComponent } from './catalogue/product-catalogue.component';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'uc-root',
  standalone: true,
  imports: [ProductCatalogueComponent],
  template: `
    <main class="container py-4 py-md-5">
      <header class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <a class="brand-mark text-decoration-none" href="/" aria-label="Utsav Crackers home">UTSAV CRACKERS</a>
        <div class="d-flex align-items-center gap-2">
          @if (auth.isAuthenticated) {
            <span class="small text-secondary d-none d-sm-inline">{{ auth.username }}</span>
            <button class="btn btn-outline-secondary btn-sm" type="button" (click)="logout()">Sign out</button>
          } @else {
            <button class="btn btn-outline-success btn-sm" type="button" (click)="login()">Sign in</button>
          }
        </div>
      </header>
      <section class="hero rounded-4 p-4 p-md-5">
        <p class="eyebrow mb-2">CELEBRATE RESPONSIBLY</p>
        <h1 class="display-5 fw-bold mb-3">Celebrate with care.</h1>
        <p class="lead mb-0">Discover products with transparent pricing and clear fulfilment information.</p>
      </section>
      <uc-product-catalogue />
      <section class="border-top pt-3 text-secondary small">
        Product availability and delivery eligibility will be confirmed before checkout.
      </section>
    </main>
  `,
  styles: [`
    .brand-mark { color: #172b24; font-size: .9rem; font-weight: 800; letter-spacing: .14em; }
    .hero { background: #172b24; color: #fff; }
    .eyebrow { color: #f2c879; letter-spacing: .18em; font-size: .8rem; font-weight: 700; }
  `]
})
export class AppComponent {
  readonly auth = inject(AuthService);

  login(): void {
    void this.auth.login();
  }

  logout(): void {
    void this.auth.logout();
  }
}
