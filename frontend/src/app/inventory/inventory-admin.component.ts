import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { InventoryBalance, InventoryMovement } from './inventory.model';
import { InventoryService } from './inventory.service';

@Component({
  selector: 'uc-inventory-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (auth.hasRole('ADMIN')) {
      <section class="inventory-panel" aria-labelledby="inventory-title">
        <div class="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
          <div>
            <p class="inventory-eyebrow mb-1">STOCK CONTROL</p>
            <h2 id="inventory-title" class="h4 mb-0">Inventory ledger</h2>
          </div>
          <button class="btn btn-sm btn-outline-secondary" type="button" [disabled]="loading()" (click)="load()">Refresh stock</button>
        </div>

        @if (error()) {
          <div class="alert alert-warning py-2" role="alert">{{ error() }}</div>
        }
        @if (success()) {
          <div class="alert alert-success py-2" role="status">{{ success() }}</div>
        }

        <div class="row g-4">
          <div class="col-12 col-lg-5">
            <div class="inventory-card h-100">
              <h3 class="h5">Record stock adjustment</h3>
              <form [formGroup]="form" (ngSubmit)="adjust()">
                <label class="form-label" for="inventory-product">Product</label>
                <select id="inventory-product" class="form-select mb-3" formControlName="productId" (change)="onProductChange()">
                  <option value="">Select product</option>
                  @for (item of balances(); track item.productId) {
                    <option [value]="item.productId">{{ item.productName }} · {{ item.sku }}</option>
                  }
                </select>
                <label class="form-label" for="inventory-delta">Quantity change</label>
                <input id="inventory-delta" class="form-control mb-1" type="number" step="1" min="-1000000" max="1000000" formControlName="quantityDelta">
                <p class="small text-secondary">Use a positive number to add stock or a negative number to remove stock. Zero is not allowed.</p>
                <label class="form-label" for="inventory-reason">Reason / reference</label>
                <textarea id="inventory-reason" class="form-control mb-3" rows="2" maxlength="255" formControlName="reason" placeholder="Opening stock, physical count correction…"></textarea>
                <button class="btn btn-success" type="submit" [disabled]="form.invalid || saving() || balances().length === 0">
                  {{ saving() ? 'Saving…' : 'Record adjustment' }}
                </button>
              </form>
            </div>
          </div>

          <div class="col-12 col-lg-7">
            <div class="inventory-card h-100">
              <h3 class="h5">Stock by product</h3>
              @if (loading()) {
                <p class="text-secondary small" role="status">Loading inventory…</p>
              } @else if (balances().length === 0) {
                <p class="text-secondary mb-0">No active products are available for inventory setup.</p>
              } @else {
                <div class="table-responsive">
                  <table class="table table-sm align-middle mb-0">
                    <thead><tr><th>Product</th><th class="text-end">On hand</th><th class="text-end">Reserved</th><th class="text-end">Available</th></tr></thead>
                    <tbody>
                      @for (item of balances(); track item.productId) {
                        <tr [class.table-active]="selectedProductId() === item.productId">
                          <td><button class="btn btn-link p-0 text-start text-decoration-none" type="button" (click)="selectProduct(item.productId)">{{ item.productName }}<span class="d-block small text-secondary">{{ item.sku }}</span></button></td>
                          <td class="text-end">{{ item.onHandQuantity }}</td>
                          <td class="text-end">{{ item.reservedQuantity }}</td>
                          <td class="text-end fw-semibold">{{ item.availableQuantity }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </div>
        </div>

        @if (selectedProductId()) {
          <div class="inventory-card mt-4">
            <h3 class="h5">Movement history</h3>
            @if (movements().length === 0) {
              <p class="text-secondary small mb-0">No recorded movements for this product yet.</p>
            } @else {
              <div class="table-responsive">
                <table class="table table-sm align-middle mb-0">
                  <thead><tr><th>Date</th><th>Type</th><th class="text-end">Change</th><th class="text-end">On hand after</th><th>Reason</th></tr></thead>
                  <tbody>
                    @for (movement of movements(); track movement.id) {
                      <tr>
                        <td class="small">{{ movement.createdAt | date:'medium' }}</td>
                        <td>{{ movement.movementType }}</td>
                        <td class="text-end" [class.text-success]="movement.quantityDelta > 0" [class.text-danger]="movement.quantityDelta < 0">{{ movement.quantityDelta > 0 ? '+' : '' }}{{ movement.quantityDelta }}</td>
                        <td class="text-end">{{ movement.onHandAfter }}</td>
                        <td>{{ movement.reason }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }
        <p class="small text-secondary mt-3 mb-0">Adjustments are audited. Stock reservations, supplier receipts, returns and order deductions will use dedicated workflows and cannot be simulated by this screen.</p>
      </section>
    }
  `,
  styles: [`
    .inventory-panel { background: #fff; border: 1px solid #e4e9e5; border-radius: 1rem; padding: 1.25rem; margin: 1.5rem 0; }
    .inventory-eyebrow { color: #8b6a2c; font-size: .72rem; font-weight: 700; letter-spacing: .16em; }
    .inventory-card { background: #fbfcfa; border: 1px solid #e8ede9; border-radius: .85rem; padding: 1rem; }
  `]
})
export class InventoryAdminComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly inventoryApi = inject(InventoryService);
  private readonly fb = inject(FormBuilder);

  readonly balances = signal<InventoryBalance[]>([]);
  readonly movements = signal<InventoryMovement[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly selectedProductId = signal('');

  readonly form = this.fb.nonNullable.group({
    productId: ['', Validators.required],
    quantityDelta: [1, [Validators.required, Validators.min(-1000000), Validators.max(1000000), Validators.pattern(/^-?[1-9][0-9]*$/)]],
    reason: ['', [Validators.required, Validators.maxLength(255)]]
  });

  ngOnInit(): void {
    if (this.auth.hasRole('ADMIN')) {
      this.load();
    }
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.inventoryApi.listBalances().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: balances => {
        this.balances.set(balances);
        const selected = this.selectedProductId();
        if (selected && balances.some(item => item.productId === selected)) {
          this.loadMovements(selected);
        } else if (balances.length > 0) {
          this.selectProduct(balances[0].productId);
        } else {
          this.selectedProductId.set('');
          this.movements.set([]);
        }
      },
      error: () => this.error.set('Inventory could not be loaded.')
    });
  }

  onProductChange(): void {
    const id = this.form.controls.productId.value;
    if (id) {
      this.selectProduct(id);
    }
  }

  selectProduct(id: string): void {
    this.selectedProductId.set(id);
    this.form.controls.productId.setValue(id);
    this.loadMovements(id);
  }

  loadMovements(id: string): void {
    this.inventoryApi.listMovements(id).subscribe({
      next: movements => this.movements.set(movements),
      error: () => this.error.set('Inventory movement history could not be loaded.')
    });
  }

  adjust(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    this.inventoryApi.adjust(value.productId, value.quantityDelta, value.reason)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.success.set('Inventory adjustment recorded.');
          this.form.controls.quantityDelta.setValue(1);
          this.form.controls.reason.setValue('');
          this.load();
        },
        error: () => this.error.set('Adjustment was rejected. Check available stock and the reason.')
      });
  }
}
