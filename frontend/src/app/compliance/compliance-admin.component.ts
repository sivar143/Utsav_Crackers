import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { FireworksPolicy, FireworksPolicyRequest } from './fireworks-policy.model';
import { FireworksPolicyService } from './fireworks-policy.service';

@Component({
  selector: 'uc-compliance-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (auth.hasRole('ADMIN')) {
      <section class="compliance-panel" aria-labelledby="compliance-title">
        <div class="mb-3">
          <p class="compliance-eyebrow mb-1">LEGAL AND SAFETY CONTROLS</p>
          <h2 id="compliance-title" class="h4 mb-1">Fireworks jurisdiction policies</h2>
          <p class="small text-secondary mb-0">Unconfigured or unapproved locations remain blocked. Policy creation and approval require two different administrators.</p>
        </div>
        @if (error()) {
          <div class="alert alert-warning py-2" role="alert">{{ error() }}</div>
        }
        @if (success()) {
          <div class="alert alert-success py-2" role="status">{{ success() }}</div>
        }

        <div class="compliance-card mb-4">
          <h3 class="h5">Create a draft policy</h3>
          <form [formGroup]="form" (ngSubmit)="create()">
            <div class="row g-3">
              <div class="col-12 col-md-4">
                <label class="form-label" for="policy-state">State / UT code</label>
                <input id="policy-state" class="form-control" formControlName="stateCode" placeholder="IN-AP">
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label" for="policy-district">District (optional)</label>
                <input id="policy-district" class="form-control" formControlName="district">
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label" for="policy-pin">PIN code (optional)</label>
                <input id="policy-pin" class="form-control" formControlName="postalCode" inputmode="numeric" maxlength="6">
              </div>
              <div class="col-12">
                <div class="d-flex flex-wrap gap-3">
                  <label class="form-check"><input class="form-check-input" type="checkbox" formControlName="saleAllowed"> <span class="form-check-label">Sale permitted</span></label>
                  <label class="form-check"><input class="form-check-input" type="checkbox" formControlName="deliveryAllowed"> <span class="form-check-label">Delivery permitted</span></label>
                  <label class="form-check"><input class="form-check-input" type="checkbox" formControlName="transportAllowed"> <span class="form-check-label">Transport permitted</span></label>
                  <label class="form-check"><input class="form-check-input" type="checkbox" formControlName="storageAllowed"> <span class="form-check-label">Storage permitted</span></label>
                </div>
                <p class="small text-secondary mb-0">Leave any activity unchecked if it is prohibited or has not been verified from an authoritative source.</p>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label" for="policy-from">Effective from</label>
                <input id="policy-from" class="form-control" type="datetime-local" formControlName="effectiveFrom">
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label" for="policy-until">Effective until (optional)</label>
                <input id="policy-until" class="form-control" type="datetime-local" formControlName="effectiveUntil">
              </div>
              <div class="col-12">
                <label class="form-label" for="policy-source">Official source reference</label>
                <input id="policy-source" class="form-control" formControlName="sourceReference" maxlength="500" placeholder="Government order / gazette / licence reference">
              </div>
              <div class="col-12">
                <label class="form-label" for="policy-notes">Legal review notes</label>
                <textarea id="policy-notes" class="form-control" rows="2" formControlName="legalNotes" maxlength="2000"></textarea>
              </div>
            </div>
            <button class="btn btn-success mt-3" type="submit" [disabled]="form.invalid || saving()">
              {{ saving() ? 'Saving…' : 'Save draft policy' }}
            </button>
          </form>
        </div>

        <div class="d-flex justify-content-between align-items-center mb-2">
          <h3 class="h5 mb-0">Policy register</h3>
          <button class="btn btn-sm btn-outline-secondary" type="button" [disabled]="loading()" (click)="load()">Refresh</button>
        </div>
        @if (loading()) {
          <p class="small text-secondary" role="status">Loading policy register…</p>
        } @else if (policies().length === 0) {
          <p class="text-secondary">No jurisdiction policies have been configured. All locations remain blocked.</p>
        } @else {
          <div class="d-grid gap-3">
            @for (policy of policies(); track policy.id) {
              <article class="policy-card">
                <div class="d-flex flex-wrap justify-content-between align-items-start gap-2">
                  <div>
                    <div class="fw-semibold">{{ policy.scopeType }} · {{ policy.stateCode }}{{ policy.district ? ' · ' + policy.district : '' }}{{ policy.postalCode ? ' · ' + policy.postalCode : '' }}</div>
                    <div class="small text-secondary">Effective {{ policy.effectiveFrom | date:'medium' }}{{ policy.effectiveUntil ? ' to ' + (policy.effectiveUntil | date:'medium') : ' onward' }}</div>
                  </div>
                  <span class="badge" [class.text-bg-secondary]="policy.status === 'DRAFT'" [class.text-bg-success]="policy.status === 'APPROVED'" [class.text-bg-danger]="policy.status === 'REVOKED'">{{ policy.status }}</span>
                </div>
                <div class="d-flex flex-wrap gap-2 small my-2">
                  <span [class.text-success]="policy.saleAllowed" [class.text-danger]="!policy.saleAllowed">Sale: {{ policy.saleAllowed ? 'Yes' : 'No' }}</span>
                  <span [class.text-success]="policy.deliveryAllowed" [class.text-danger]="!policy.deliveryAllowed">Delivery: {{ policy.deliveryAllowed ? 'Yes' : 'No' }}</span>
                  <span [class.text-success]="policy.transportAllowed" [class.text-danger]="!policy.transportAllowed">Transport: {{ policy.transportAllowed ? 'Yes' : 'No' }}</span>
                  <span [class.text-success]="policy.storageAllowed" [class.text-danger]="!policy.storageAllowed">Storage: {{ policy.storageAllowed ? 'Yes' : 'No' }}</span>
                </div>
                <div class="small"><strong>Source:</strong> {{ policy.sourceReference }}</div>
                <div class="small text-secondary mt-1">{{ policy.legalNotes }}</div>
                <div class="small text-secondary mt-1">Created by {{ policy.createdBy }}{{ policy.reviewedBy ? ' · reviewed by ' + policy.reviewedBy : '' }}</div>
                @if (policy.status === 'DRAFT') {
                  @if (policy.createdBy !== auth.subject) {
                    <button class="btn btn-sm btn-outline-success mt-2" type="button" [disabled]="saving()" (click)="approve(policy.id)">Approve as second reviewer</button>
                  } @else {
                    <p class="small text-warning mt-2 mb-0">Awaiting approval by a different administrator.</p>
                  }
                } @else if (policy.status === 'APPROVED') {
                  @if (pendingRevokeId() === policy.id) {
                    <div class="d-flex flex-wrap gap-2 mt-2">
                      <input class="form-control form-control-sm revoke-reason" [formControl]="revokeReason" placeholder="Reason for revocation">
                      <button class="btn btn-sm btn-danger" type="button" [disabled]="revokeReason.invalid || saving()" (click)="revoke(policy.id)">Confirm revocation</button>
                      <button class="btn btn-sm btn-link" type="button" (click)="cancelRevoke()">Cancel</button>
                    </div>
                  } @else {
                    <button class="btn btn-sm btn-outline-danger mt-2" type="button" (click)="startRevoke(policy.id)">Revoke policy</button>
                  }
                } @else if (policy.revocationReason) {
                  <p class="small text-danger mt-2 mb-0">Revoked: {{ policy.revocationReason }} · {{ policy.revokedBy }}</p>
                }
              </article>
            }
          </div>
        }
      </section>
    }
  `,
  styles: [`
    .compliance-panel { background: #fff; border: 1px solid #e4e9e5; border-radius: 1rem; padding: 1.25rem; margin: 1.5rem 0; }
    .compliance-eyebrow { color: #8b6a2c; font-size: .72rem; font-weight: 700; letter-spacing: .16em; }
    .compliance-card, .policy-card { background: #fbfcfa; border: 1px solid #e8ede9; border-radius: .85rem; padding: 1rem; }
    .revoke-reason { max-width: 24rem; }
  `]
})
export class ComplianceAdminComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(FireworksPolicyService);
  private readonly fb = inject(FormBuilder);

  readonly policies = signal<FireworksPolicy[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly pendingRevokeId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    stateCode: ['IN-AP', [Validators.required, Validators.pattern(/^IN-[A-Z]{2}$/)]],
    district: ['', Validators.maxLength(100)],
    postalCode: ['', Validators.pattern(/^[0-9]{6}$/)],
    saleAllowed: [false],
    deliveryAllowed: [false],
    transportAllowed: [false],
    storageAllowed: [false],
    effectiveFrom: [this.localDateTime(), Validators.required],
    effectiveUntil: [''],
    sourceReference: ['', [Validators.required, Validators.maxLength(500)]],
    legalNotes: ['', [Validators.required, Validators.maxLength(2000)]]
  });

  readonly revokeReason = this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(500)]);

  ngOnInit(): void {
    if (this.auth.hasRole('ADMIN')) {
      this.load();
    }
  }

  load(): void {
    this.loading.set(true);
    this.api.list().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: policies => this.policies.set(policies),
      error: () => this.error.set('The compliance policy register could not be loaded.')
    });
  }

  create(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const request: FireworksPolicyRequest = {
      ...value,
      district: value.district.trim() || null,
      postalCode: value.postalCode.trim() || null,
      effectiveFrom: new Date(value.effectiveFrom).toISOString(),
      effectiveUntil: value.effectiveUntil ? new Date(value.effectiveUntil).toISOString() : null
    };
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    this.api.create(request).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.success.set('Draft policy saved. A different administrator must approve it before it can be used.');
        this.form.patchValue({ district: '', postalCode: '', saleAllowed: false, deliveryAllowed: false,
          transportAllowed: false, storageAllowed: false, sourceReference: '', legalNotes: '', effectiveUntil: '' });
        this.load();
      },
      error: () => this.error.set('The policy could not be saved. Check the jurisdiction and effective period.')
    });
  }

  approve(id: string): void {
    this.saving.set(true);
    this.error.set('');
    this.api.approve(id).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.success.set('Policy approved and audit reviewer recorded.');
        this.load();
      },
      error: () => this.error.set('Policy approval was rejected. Confirm that you are a different administrator and no approved policy overlaps this period.')
    });
  }

  startRevoke(id: string): void {
    this.pendingRevokeId.set(id);
    this.revokeReason.setValue('');
  }

  cancelRevoke(): void {
    this.pendingRevokeId.set(null);
    this.revokeReason.setValue('');
  }

  revoke(id: string): void {
    if (this.revokeReason.invalid || this.saving()) {
      this.revokeReason.markAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.api.revoke(id, this.revokeReason.value).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.success.set('Policy revoked. The revoking administrator and reason have been audited.');
        this.cancelRevoke();
        this.load();
      },
      error: () => this.error.set('Policy could not be revoked.')
    });
  }

  private localDateTime(): string {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }
}
