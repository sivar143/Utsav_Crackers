import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { catchError, finalize, of } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { CartService } from '../cart/cart.service';
import { Product } from './product.model';
import { ProductService } from './product.service';

@Component({
  selector: 'uc-product-catalogue',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-catalogue.component.html',
  styleUrl: './product-catalogue.component.css'
})
export class ProductCatalogueComponent implements OnInit {
  private readonly productService = inject(ProductService);
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  @Output() readonly requestSignIn = new EventEmitter<void>();

  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.productService.listActive()
      .pipe(
        catchError(() => {
          this.error.set('The catalogue is temporarily unavailable. Please try again later.');
          return of([]);
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe(products => this.products.set(products));
  }

  addToCart(product: Product): void {
    if (!this.auth.isAuthenticated) {
      this.requestSignIn.emit();
      return;
    }
    this.cart.addOne(product.id);
  }
}
