import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { CustomerAddress, CustomerAddressRequest } from './customer-address.model';
import { CustomerAddressService } from './customer-address.service';

@Component({
  selector: 'uc-address-book',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (auth.isAuthenticated) {
      <section class="address-panel" aria-labelledby="address-title">
        <div class="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
          <div>
            <p class="address-eyebrow mb-1">DELIVERY DETAILS</p>
            <h2 id="address-title" class="h4 mb-0">Your addresses</h2>
          </div>
          <span class="text-secondary small">Indian delivery addresses only</span>
        </div>

        @if (error()) {
          <div class="alert alert-warning py-2" role="alert">{{ error() }}</div>
        }

        @if (loading()) {
          <p class="text-secondary small" role="status">Loading your saved addresses…</p>
        } @else if (addresses().length === 0) {
          <p class="text-secondary">No address saved yet. Add an address to prepare for delivery eligibility checks.</p>
        } @else {
          <div class="row g-3 mb-4">
            @for (address of addresses(); track address.id) {
              <div class="col-12 col-lg-6">
                <article class="saved-address h-100">
                  <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                    <div class="fw-semibold">{{ address.label }}</div>
                    @if (address.defaultAddress) {
                      <span class="badge text-bg-success">Default</span>
                    }
                  </div>
                  <div>{{ address.recipientName }} · {{ address.phoneNumber }}</div>
                  <div class="text-secondary small mt-1">
                    {{ address.addressLine1 }}
                    @if (address.addressLine2) {, {{ address.addressLine2 }}}
                    @if (address.landmark) {, {{ address.landmark }}}
                    <br>{{ address.city }}, {{ address.district }}
                    <br>{{ address.stateCode }} – {{ address.postalCode }}, {{ address.countryCode }}
                  </div>
                  <div class="d-flex flex-wrap gap-2 mt-3">
                    @if (!address.defaultAddress) {
                      <button class="btn btn-sm btn-outline-success" type="button" (click)="setDefault(address.id)">Make default</button>
                    }
                    <button class="btn btn-sm btn-outline-secondary" type="button" (click)="edit(address)">Edit</button>
                    @if (pendingDeleteId() === address.id) {
                      <button class="btn btn-sm btn-danger" type="button" [disabled]="saving()" (click)="confirmDelete(address.id)">Confirm delete</button>
                      <button class="btn btn-sm btn-link text-secondary" type="button" (click)="pendingDeleteId.set(null)">Cancel</button>
                    } @else {
                      <button class="btn btn-sm btn-link text-secondary" type="button" (click)="pendingDeleteId.set(address.id)">Delete</button>
                    }
                  </div>
                </article>
              </div>
            }
          </div>
        }

        <div class="border-top pt-3">
          <h3 class="h5 mb-3">{{ editingId() ? 'Update address' : 'Add an address' }}</h3>
          <form [formGroup]="form" (ngSubmit)="save()" novalidate>
            <div class="row g-3">
              <div class="col-12 col-md-4">
                <label class="form-label" for="address-label">Address label</label>
                <input id="address-label" class="form-control" formControlName="label" placeholder="Home, Office">
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label" for="recipient-name">Recipient name</label>
                <input id="recipient-name" class="form-control" formControlName="recipientName">
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label" for="phone-number">Phone number</label>
                <input id="phone-number" class="form-control" formControlName="phoneNumber" placeholder="+919876543210">
              </div>
              <div class="col-12">
                <label class="form-label" for="address-line-1">Address line 1</label>
                <input id="address-line-1" class="form-control" formControlName="addressLine1">
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label" for="address-line-2">Address line 2 (optional)</label>
                <input id="address-line-2" class="form-control" formControlName="addressLine2">
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label" for="address-landmark">Landmark (optional)</label>
                <input id="address-landmark" class="form-control" formControlName="landmark">
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label" for="address-city">City / town</label>
                <input id="address-city" class="form-control" formControlName="city">
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label" for="address-district">District</label>
                <input id="address-district" class="form-control" formControlName="district">
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label" for="address-state">State / UT</label>
                <select id="address-state" class="form-select" formControlName="stateCode">
                  @for (state of states; track state.code) {
                    <option [value]="state.code">{{ state.name }}</option>
                  }
                </select>
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label" for="address-postal-code">PIN code</label>
                <input id="address-postal-code" class="form-control" formControlName="postalCode" inputmode="numeric" maxlength="6">
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label">Country</label>
                <input class="form-control" value="India" readonly>
              </div>
            </div>
            @if (form.invalid && form.touched) {
              <p class="small text-danger mt-3 mb-0" role="alert">Please complete the required fields. Use an international phone number and a valid 6-digit PIN code.</p>
            }
            <div class="d-flex flex-wrap gap-2 mt-3">
              <button class="btn btn-success" type="submit" [disabled]="form.invalid || saving()">
                {{ saving() ? 'Saving…' : (editingId() ? 'Save changes' : 'Save address') }}
              </button>
              @if (editingId()) {
                <button class="btn btn-outline-secondary" type="button" [disabled]="saving()" (click)="resetForm()">Cancel edit</button>
              }
            </div>
            <p class="small text-secondary mt-3 mb-0">An address is not delivery approval. Legal and carrier eligibility will be checked again at checkout.</p>
          </form>
        </div>
      </section>
    }
  `,
  styles: [`
    .address-panel { background: #fff; border: 1px solid #e4e9e5; border-radius: 1rem; padding: 1.25rem; margin: 1.5rem 0; }
    .address-eyebrow { color: #8b6a2c; font-size: .72rem; font-weight: 700; letter-spacing: .16em; }
    .saved-address { border: 1px solid #e4e9e5; border-radius: .85rem; padding: 1rem; }
  `]
})
export class CustomerAddressComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly addressService = inject(CustomerAddressService);
  private readonly fb = inject(FormBuilder);

  readonly addresses = signal<CustomerAddress[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly editingId = signal<string | null>(null);
  readonly pendingDeleteId = signal<string | null>(null);

  readonly states = [
    { code: 'IN-AP', name: 'Andhra Pradesh' }, { code: 'IN-AR', name: 'Arunachal Pradesh' },
    { code: 'IN-AS', name: 'Assam' }, { code: 'IN-BR', name: 'Bihar' },
    { code: 'IN-CG', name: 'Chhattisgarh' }, { code: 'IN-GA', name: 'Goa' },
    { code: 'IN-GJ', name: 'Gujarat' }, { code: 'IN-HR', name: 'Haryana' },
    { code: 'IN-HP', name: 'Himachal Pradesh' }, { code: 'IN-JH', name: 'Jharkhand' },
    { code: 'IN-KA', name: 'Karnataka' }, { code: 'IN-KL', name: 'Kerala' },
    { code: 'IN-MP', name: 'Madhya Pradesh' }, { code: 'IN-MH', name: 'Maharashtra' },
    { code: 'IN-MN', name: 'Manipur' }, { code: 'IN-ML', name: 'Meghalaya' },
    { code: 'IN-MZ', name: 'Mizoram' }, { code: 'IN-NL', name: 'Nagaland' },
    { code: 'IN-OD', name: 'Odisha' }, { code: 'IN-PB', name: 'Punjab' },
    { code: 'IN-RJ', name: 'Rajasthan' }, { code: 'IN-SK', name: 'Sikkim' },
    { code: 'IN-TN', name: 'Tamil Nadu' }, { code: 'IN-TS', name: 'Telangana' },
    { code: 'IN-TR', name: 'Tripura' }, { code: 'IN-UP', name: 'Uttar Pradesh' },
    { code: 'IN-UT', name: 'Uttarakhand' }, { code: 'IN-WB', name: 'West Bengal' },
    { code: 'IN-AN', name: 'Andaman and Nicobar Islands' }, { code: 'IN-CH', name: 'Chandigarh' },
    { code: 'IN-DH', name: 'Dadra and Nagar Haveli and Daman and Diu' },
    { code: 'IN-DL', name: 'Delhi' }, { code: 'IN-JK', name: 'Jammu and Kashmir' },
    { code: 'IN-LA', name: 'Ladakh' }, { code: 'IN-LD', name: 'Lakshadweep' },
    { code: 'IN-PY', name: 'Puducherry' }
  ];

  readonly form = this.fb.nonNullable.group({
    label: ['Home', [Validators.required, Validators.maxLength(40)]],
    recipientName: ['', [Validators.required, Validators.maxLength(120)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^\+?[1-9][0-9]{7,14}$/)]],
    addressLine1: ['', [Validators.required, Validators.maxLength(180)]],
    addressLine2: ['', Validators.maxLength(180)],
    landmark: ['', Validators.maxLength(180)],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    district: ['', [Validators.required, Validators.maxLength(100)]],
    stateCode: ['IN-AP', [Validators.required, Validators.pattern(/^IN-[A-Z]{2}$/)]],
    postalCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    countryCode: ['IN']
  });

  ngOnInit(): void {
    if (this.auth.isAuthenticated) {
      this.load();
    }
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.addressService.list().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: addresses => this.addresses.set(addresses),
      error: () => this.error.set('Your saved addresses could not be loaded. Please try again.')
    });
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const request = this.form.getRawValue() as CustomerAddressRequest;
    const id = this.editingId();
    this.saving.set(true);
    this.error.set('');
    const action = id
      ? this.addressService.update(id, request)
      : this.addressService.create(request);
    action.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.resetForm();
        this.load();
      },
      error: () => this.error.set('The address could not be saved. Check the details and try again.')
    });
  }

  edit(address: CustomerAddress): void {
    this.editingId.set(address.id);
    this.pendingDeleteId.set(null);
    this.form.patchValue({
      label: address.label,
      recipientName: address.recipientName,
      phoneNumber: address.phoneNumber,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? '',
      landmark: address.landmark ?? '',
      city: address.city,
      district: address.district,
      stateCode: address.stateCode,
      postalCode: address.postalCode,
      countryCode: address.countryCode
    });
  }

  setDefault(id: string): void {
    this.addressService.makeDefault(id).subscribe({
      next: () => this.load(),
      error: () => this.error.set('The default address could not be changed.')
    });
  }

  confirmDelete(id: string): void {
    this.saving.set(true);
    this.addressService.remove(id).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.pendingDeleteId.set(null);
        if (this.editingId() === id) {
          this.resetForm();
        }
        this.load();
      },
      error: () => this.error.set('The address could not be deleted.')
    });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.pendingDeleteId.set(null);
    this.form.reset({
      label: 'Home', recipientName: '', phoneNumber: '', addressLine1: '',
      addressLine2: '', landmark: '', city: '', district: '', stateCode: 'IN-AP',
      postalCode: '', countryCode: 'IN'
    });
  }
}
