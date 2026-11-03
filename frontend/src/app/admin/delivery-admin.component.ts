import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

interface AdminDelivery {
  orderId: string;
  customerSubject: string;
  deliveryAddress: string;
  itemsSnapshot: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  orderedAt: string;
  deliveryStatus: 'PENDING' | 'PACKED' | 'DISPATCHED' | 'DELIVERED';
}

@Component({
  selector: 'uc-delivery-admin',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  template: `
    <section class="delivery-admin admin-card mt-4" aria-labelledby="delivery-queue-title">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <p class="admin-eyebrow mb-1">FULFILMENT</p>
          <h3 id="delivery-queue-title" class="h5 mb-0">Deliveries to fulfil</h3>
        </div>
        <button class="btn btn-sm btn-outline-secondary" type="button" (click)="load()" [disabled]="loading()">Refresh</button>
      </div>
      @if (error()) { <div class="alert alert-warning py-2" role="alert">{{ error() }}</div> }
      @if (success()) { <div class="alert alert-success py-2" role="status">{{ success() }}</div> }
      @if (loading()) {
        <p class="text-secondary small mb-0" role="status">Loading paid orders…</p>
      } @else if (deliveries().length === 0) {
        <p class="text-secondary mb-0">There are no paid orders awaiting delivery.</p>
      } @else {
        <div class="table-responsive">
          <table class="table table-sm align-middle">
            <thead><tr><th>Order</th><th>Customer reference</th><th>Delivery address</th><th>Items</th><th class="text-end">Amount</th><th>Status</th><th>Update</th></tr></thead>
            <tbody>
              @for (delivery of deliveries(); track delivery.orderId) {
                <tr>
                  <td><span class="fw-semibold">{{ delivery.orderId.slice(0, 8) }}</span><div class="small text-secondary">{{ delivery.orderedAt | date:'medium' }}</div></td>
                  <td class="small text-break">{{ delivery.customerSubject }}</td>
                  <td class="small delivery-address">{{ delivery.deliveryAddress }}</td>
                  <td><details><summary>View items</summary><pre class="small items-snapshot mt-2">{{ delivery.itemsSnapshot }}</pre></details></td>
                  <td class="text-end text-nowrap">{{ delivery.amount | currency:delivery.currency:'symbol':'1.2-2' }}</td>
                  <td><span class="badge" [class.text-bg-secondary]="delivery.deliveryStatus === 'PENDING'" [class.text-bg-info]="delivery.deliveryStatus === 'PACKED'" [class.text-bg-primary]="delivery.deliveryStatus === 'DISPATCHED'" [class.text-bg-success]="delivery.deliveryStatus === 'DELIVERED'">{{ delivery.deliveryStatus }}</span></td>
                  <td>
                    <select class="form-select form-select-sm" [value]="delivery.deliveryStatus" [disabled]="savingId() === delivery.orderId" (change)="updateStatus(delivery, $any($event.target).value)" [attr.aria-label]="'Update delivery status for order ' + delivery.orderId">
                      <option value="PENDING">Pending</option><option value="PACKED">Packed</option><option value="DISPATCHED">Dispatched</option><option value="DELIVERED">Delivered</option>
                    </select>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
      <p class="small text-secondary mb-0">Only payment-confirmed orders appear here. Customer delivery addresses are taken from the order snapshot; administrator profiles do not require addresses.</p>
    </section>
  `,
  styles: [`
    .delivery-admin { background: #fbfcfa; border: 1px solid #e8ede9; border-radius: .85rem; padding: 1rem; }
    .admin-eyebrow { color: #8b6a2c; font-size: .72rem; font-weight: 700; letter-spacing: .16em; }
    .delivery-address { min-width: 220px; max-width: 300px; }
    .items-snapshot { max-width: 260px; white-space: pre-wrap; overflow-wrap: anywhere; }
  `]
})
export class DeliveryAdminComponent implements OnInit {
  private readonly http = inject(HttpClient);
  readonly deliveries = signal<AdminDelivery[]>([]);
  readonly loading = signal(false);
  readonly savingId = signal<string | null>(null);
  readonly error = signal('');
  readonly success = signal('');

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.http.get<AdminDelivery[]>('/api/v1/admin/deliveries')
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: values => this.deliveries.set(values),
        error: () => this.error.set('The delivery queue could not be loaded.')
      });
  }

  updateStatus(delivery: AdminDelivery, status: AdminDelivery['deliveryStatus']): void {
    this.savingId.set(delivery.orderId);
    this.error.set('');
    this.success.set('');
    this.http.put<AdminDelivery>(`/api/v1/admin/deliveries/${delivery.orderId}/status`, { status })
      .pipe(finalize(() => this.savingId.set(null)))
      .subscribe({
        next: updated => {
          this.deliveries.update(values => values.map(value => value.orderId === updated.orderId ? updated : value));
          this.success.set(`Delivery ${updated.orderId.slice(0, 8)} updated to ${updated.deliveryStatus.toLowerCase()}.`);
        },
        error: error => {
          this.error.set(error?.error?.detail || 'Delivery status could not be updated.');
        }
      });
  }
}
