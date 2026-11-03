import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Category } from '../catalogue/category.model';
import { CategoryService } from '../catalogue/category.service';
import { Product } from '../catalogue/product.model';
import { ProductService, ProductUpsertRequest } from '../catalogue/product.service';

@Component({
  selector: 'uc-catalogue-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe],
  template: `
    @if (auth.hasRole('ADMIN')) {
      <section class="admin-panel" aria-labelledby="admin-catalogue-title">
        <div class="mb-3">
          <p class="admin-eyebrow mb-1">ADMINISTRATION</p>
          <h2 id="admin-catalogue-title" class="h4 mb-0">Catalogue management</h2>
        </div>

        @if (error()) {
          <div class="alert alert-warning py-2" role="alert">{{ error() }}</div>
        }
        @if (success()) {
          <div class="alert alert-success py-2" role="status">{{ success() }}</div>
        }

        <div class="row g-4">
          <div class="col-12 col-lg-4">
            <div class="admin-card h-100">
              <h3 class="h5">Create category</h3>
              <form [formGroup]="categoryForm" (ngSubmit)="createCategory()">
                <label class="form-label" for="new-category-name">Category name</label>
                <input id="new-category-name" class="form-control mb-3" formControlName="name">
                <label class="form-label" for="new-category-slug">URL slug</label>
                <input id="new-category-slug" class="form-control mb-3" formControlName="slug" placeholder="ground-sparklers">
                <button class="btn btn-outline-success" type="submit" [disabled]="categoryForm.invalid || saving()">Create category</button>
              </form>
              <div class="small text-secondary mt-3">
                {{ categories().length }} active categories
              </div>
            </div>
          </div>

          <div class="col-12 col-lg-8">
            <div class="admin-card">
              <h3 class="h5">{{ editingId() ? 'Update product and pricing' : 'Create product' }}</h3>
              <form [formGroup]="productForm" (ngSubmit)="saveProduct()">
                <div class="row g-3">
                  <div class="col-12 col-md-4">
                    <label class="form-label" for="product-sku">SKU</label>
                    <input id="product-sku" class="form-control" formControlName="sku">
                  </div>
                  <div class="col-12 col-md-8">
                    <label class="form-label" for="product-name">Product name</label>
                    <input id="product-name" class="form-control" formControlName="name">
                  </div>
                  <div class="col-12">
                    <label class="form-label" for="product-description">Description</label>
                    <textarea id="product-description" class="form-control" rows="2" formControlName="description"></textarea>
                  </div>
                  <div class="col-12 col-md-5">
                    <label class="form-label" for="product-category">Category</label>
                    <select id="product-category" class="form-select" formControlName="categoryId">
                      <option value="">Select category</option>
                      @for (category of categories(); track category.id) {
                        <option [value]="category.id">{{ category.name }}</option>
                      }
                    </select>
                  </div>
                  <div class="col-6 col-md-4">
                    <label class="form-label" for="product-price">Unit price</label>
                    <input id="product-price" class="form-control" type="number" min="0.01" step="0.01" formControlName="price">
                  </div>
                  <div class="col-6 col-md-3">
                    <label class="form-label" for="product-currency">Currency</label>
                    <select id="product-currency" class="form-select" formControlName="currency">
                      <option value="INR">INR</option>
                    </select>
                  </div>
                </div>
                <div class="d-flex flex-wrap gap-2 mt-3">
                  <button class="btn btn-success" type="submit" [disabled]="productForm.invalid || saving() || categories().length === 0">
                    {{ editingId() ? 'Save product changes' : 'Create product' }}
                  </button>
                  @if (editingId()) {
                    <button class="btn btn-outline-secondary" type="button" (click)="resetProductForm()">Cancel edit</button>
                  }
                </div>
              </form>
            </div>
          </div>
        </div>

        <div class="admin-card mt-4">
          <div class="d-flex justify-content-between align-items-center gap-2 mb-3">
            <h3 class="h5 mb-0">Active products</h3>
            <button class="btn btn-sm btn-outline-secondary" type="button" (click)="load()" [disabled]="loading()">Refresh</button>
          </div>
          @if (loading()) {
            <p class="text-secondary small mb-0" role="status">Loading catalogue…</p>
          } @else if (products().length === 0) {
            <p class="text-secondary mb-0">No active products yet.</p>
          } @else {
            <div class="table-responsive">
              <table class="table align-middle mb-0">
                <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th class="text-end">Price</th><th class="text-end">Actions</th></tr></thead>
                <tbody>
                  @for (product of products(); track product.id) {
                    <tr>
                      <td class="fw-semibold">{{ product.name }}</td>
                      <td class="small text-secondary">{{ product.sku }}</td>
                      <td>{{ product.categoryName }}</td>
                      <td class="text-end">{{ product.price | currency:product.currency:'symbol':'1.2-2' }}</td>
                      <td class="text-end">
                        <div class="d-inline-flex flex-wrap justify-content-end gap-1">
                          <button class="btn btn-sm btn-outline-secondary" type="button" (click)="editProduct(product)">Edit</button>
                          @if (pendingDeactivateId() === product.id) {
                            <button class="btn btn-sm btn-danger" type="button" [disabled]="saving()" (click)="confirmDeactivate(product.id)">Confirm</button>
                            <button class="btn btn-sm btn-link" type="button" (click)="pendingDeactivateId.set(null)">Cancel</button>
                          } @else {
                            <button class="btn btn-sm btn-link text-danger" type="button" (click)="pendingDeactivateId.set(product.id)">Deactivate</button>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
        <p class="small text-secondary mt-3 mb-0">Product setup does not create stock or confirm that an item can be sold or delivered. Inventory and fireworks compliance checks remain separate controls.</p>
      </section>
    }
  `,
  styles: [`
    .admin-panel { background: #fff; border: 1px solid #e4e9e5; border-radius: 1rem; padding: 1.25rem; margin: 1.5rem 0; }
    .admin-eyebrow { color: #8b6a2c; font-size: .72rem; font-weight: 700; letter-spacing: .16em; }
    .admin-card { background: #fbfcfa; border: 1px solid #e8ede9; border-radius: .85rem; padding: 1rem; }
  `]
})
export class CatalogueAdminComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly productsApi = inject(ProductService);
  private readonly categoriesApi = inject(CategoryService);
  private readonly fb = inject(FormBuilder);

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly editingId = signal<string | null>(null);
  readonly pendingDeactivateId = signal<string | null>(null);

  readonly categoryForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    slug: ['', [Validators.required, Validators.maxLength(140), Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]]
  });

  readonly productForm = this.fb.nonNullable.group({
    sku: ['', [Validators.required, Validators.maxLength(64)]],
    name: ['', [Validators.required, Validators.maxLength(180)]],
    description: ['', Validators.maxLength(2000)],
    categoryId: ['', Validators.required],
    price: [0.01, [Validators.required, Validators.min(0.01)]],
    currency: ['INR', [Validators.required, Validators.pattern(/^[A-Z]{3}$/)]]
  });

  ngOnInit(): void {
    if (this.auth.hasRole('ADMIN')) {
      this.load();
    }
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.categoriesApi.listActive().subscribe({
      next: categories => this.categories.set(categories),
      error: () => this.error.set('Categories could not be loaded.')
    });
    this.productsApi.listActive().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: products => this.products.set(products),
      error: () => this.error.set('Products could not be loaded.')
    });
  }

  createCategory(): void {
    if (this.categoryForm.invalid || this.saving()) {
      this.categoryForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    this.categoriesApi.create(this.categoryForm.controls.name.value, this.categoryForm.controls.slug.value)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.categoryForm.reset({ name: '', slug: '' });
          this.success.set('Category created.');
          this.categoriesApi.listActive().subscribe({ next: values => this.categories.set(values) });
        },
        error: () => this.error.set('Category could not be created. Check for a duplicate name or slug.')
      });
  }

  saveProduct(): void {
    if (this.productForm.invalid || this.saving()) {
      this.productForm.markAllAsTouched();
      return;
    }
    const request = this.productForm.getRawValue() as ProductUpsertRequest;
    const id = this.editingId();
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    const action = id ? this.productsApi.update(id, request) : this.productsApi.create(request);
    action.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.success.set(id ? 'Product updated.' : 'Product created.');
        this.resetProductForm();
        this.load();
      },
      error: () => this.error.set('Product could not be saved. Check the SKU, category and price.')
    });
  }

  editProduct(product: Product): void {
    this.editingId.set(product.id);
    this.pendingDeactivateId.set(null);
    this.productForm.patchValue({
      sku: product.sku,
      name: product.name,
      description: product.description ?? '',
      categoryId: product.categoryId,
      price: product.price,
      currency: product.currency
    });
  }

  confirmDeactivate(id: string): void {
    this.saving.set(true);
    this.productsApi.deactivate(id).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.pendingDeactivateId.set(null);
        if (this.editingId() === id) {
          this.resetProductForm();
        }
        this.success.set('Product deactivated.');
        this.load();
      },
      error: () => this.error.set('Product could not be deactivated.')
    });
  }

  resetProductForm(): void {
    this.editingId.set(null);
    this.productForm.reset({
      sku: '', name: '', description: '', categoryId: '', price: 0.01, currency: 'INR'
    });
  }
}
