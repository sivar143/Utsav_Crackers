import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, computed, inject, signal } from '@angular/core';
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
  readonly searchTerm = signal('');
  readonly selectedCategory = signal('All');
  readonly sortOrder = signal<'featured' | 'name' | 'price-low' | 'price-high'>('featured');
  readonly categories = computed(() => ['All', ...new Set(this.products().map(product => product.categoryName).filter(Boolean).sort((a, b) => a.localeCompare(b)))]);
  readonly filteredProducts = computed(() => {
    const term = this.searchTerm().trim().toLocaleLowerCase();
    const category = this.selectedCategory();
    const filtered = this.products().filter(product =>
      (category === 'All' || product.categoryName === category) &&
      (!term || [product.name, product.description ?? '', product.categoryName, product.sku]
        .some(value => value.toLocaleLowerCase().includes(term)))
    );
    switch (this.sortOrder()) {
      case 'name': return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
      case 'price-low': return [...filtered].sort((a, b) => a.price - b.price);
      case 'price-high': return [...filtered].sort((a, b) => b.price - a.price);
      default: return filtered;
    }
  });

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
