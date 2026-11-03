import { Component } from '@angular/core';
import { ProductCatalogueComponent } from './catalogue/product-catalogue.component';

@Component({
  selector: 'uc-root',
  standalone: true,
  imports: [ProductCatalogueComponent],
  template: `
    <main class="container py-5">
      <section class="hero rounded-4 p-4 p-md-5">
        <p class="eyebrow mb-2">UTSAV CRACKERS</p>
        <h1 class="display-5 fw-bold mb-3">Celebrate with care.</h1>
        <p class="lead mb-0">A safer, transparent way to discover products, place orders and track delivery.</p>
      </section>
      <uc-product-catalogue />
      <section class="border-top pt-3 text-secondary small">
        Product availability and delivery eligibility will be confirmed before checkout.
      </section>
    </main>
  `,
  styles: [`.hero { background: #172b24; color: #fff; } .eyebrow { color: #f2c879; letter-spacing: .18em; font-size: .8rem; font-weight: 700; }`]
})
export class AppComponent {}
