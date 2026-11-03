import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from './auth.service';

interface CustomerTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

@Component({
  selector: 'uc-customer-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (!auth.isAuthenticated) {
      <section class="auth-panel" aria-labelledby="customer-auth-title">
        <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
          <div>
            <p class="auth-eyebrow mb-1">YOUR UTSAV ACCOUNT</p>
            <h2 id="customer-auth-title" class="h4 mb-1">{{ mode() === 'register' ? 'Create your account' : 'Sign in or create an account' }}</h2>
            <p class="text-secondary small mb-0">Continue securely with a one-time verification code. No password required.</p>
          </div>
          <button class="btn-close" type="button" aria-label="Close account panel" (click)="close.emit()"></button>
        </div>
        @if (error()) { <div class="alert alert-danger py-2" role="alert">{{ error() }}</div> }
        @if (message()) { <div class="alert alert-success py-2" role="status">{{ message() }}</div> }
        @if (!codeSent()) {
          <div class="d-flex flex-wrap gap-2 mb-3" role="group" aria-label="Verification method">
            <button type="button" class="btn" [class.btn-success]="channel() === 'EMAIL'" [class.btn-outline-success]="channel() !== 'EMAIL'" (click)="selectChannel('EMAIL')">Continue with email</button>
            <button type="button" class="btn" [class.btn-success]="channel() === 'PHONE'" [class.btn-outline-success]="channel() !== 'PHONE'" (click)="selectChannel('PHONE')">Continue with phone</button>
          </div>
          <form [formGroup]="contactForm" (ngSubmit)="sendCode()" novalidate>
            @if (channel() === 'EMAIL') {
              <label class="form-label" for="otp-email">Email address</label>
              <input id="otp-email" class="form-control" type="email" formControlName="email" autocomplete="email" placeholder="you@example.com">
            } @else {
              <label class="form-label" for="otp-phone">Mobile number</label>
              <input id="otp-phone" class="form-control" type="tel" formControlName="phone" autocomplete="tel" placeholder="+919876543210">
              <div class="form-text">Include country code, for example +91.</div>
            }
            <button class="btn btn-success mt-3" type="submit" [disabled]="busy() || activeContactInvalid()">{{ busy() ? 'Sending code…' : 'Send verification code' }}</button>
          </form>
        } @else {
          <form [formGroup]="codeForm" (ngSubmit)="verifyCode()" novalidate>
            <p class="small text-secondary">Enter the 6-digit code sent to <strong>{{ destination() }}</strong>.</p>
            <label class="form-label" for="customer-otp">Verification code</label>
            <input id="customer-otp" class="form-control" formControlName="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456">
            <button class="btn btn-success mt-3" type="submit" [disabled]="busy() || codeForm.invalid">{{ busy() ? 'Verifying…' : 'Verify and continue' }}</button>
            <button class="btn btn-link mt-3" type="button" [disabled]="busy()" (click)="resetCode()">Use a different contact</button>
          </form>
        }
        <p class="small text-secondary mt-3 mb-0">New customers are registered automatically after successful verification.</p>
      </section>
    }
  `,
  styles: [`
    .auth-panel { background: #fff; border: 1px solid #e4e9e5; border-radius: 1rem; padding: 1.25rem; margin: 1.5rem 0; }
    .auth-eyebrow { color: #8b6a2c; font-size: .72rem; font-weight: 700; letter-spacing: .16em; }
  `]
})
export class CustomerAuthComponent {
  @Input() set initialMode(value: 'login' | 'register') { this.mode.set(value); }
  @Output() readonly close = new EventEmitter<void>();

  readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  readonly mode = signal<'login' | 'register'>('login');
  readonly channel = signal<'EMAIL' | 'PHONE'>('EMAIL');
  readonly busy = signal(false);
  readonly codeSent = signal(false);
  readonly destination = signal('');
  readonly error = signal('');
  readonly message = signal('');

  readonly contactForm = this.fb.nonNullable.group({
    email: ['', [Validators.email, Validators.maxLength(254)]],
    phone: ['', [Validators.pattern(/^\\+?[1-9][0-9]{7,14}$/)]]
  });
  readonly codeForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]]
  });

  activeContactInvalid(): boolean {
    const control = this.channel() === 'EMAIL' ? this.contactForm.controls.email : this.contactForm.controls.phone;
    return !control.value || control.invalid;
  }

  selectChannel(channel: 'EMAIL' | 'PHONE'): void {
    this.channel.set(channel);
    this.error.set('');
  }

  sendCode(): void {
    if (this.busy() || this.activeContactInvalid()) {
      (this.channel() === 'EMAIL' ? this.contactForm.controls.email : this.contactForm.controls.phone).markAsTouched();
      return;
    }
    const contact = this.channel() === 'EMAIL'
      ? this.contactForm.controls.email.value.trim()
      : this.contactForm.controls.phone.value.trim();
    this.busy.set(true);
    this.error.set('');
    this.message.set('');
    this.http.post('/api/v1/auth/customer/otp/start', { channel: this.channel(), contact })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => {
          this.destination.set(contact);
          this.codeSent.set(true);
          this.message.set('Verification code sent.');
        },
        error: response => this.error.set(response?.error?.detail ?? 'Could not send the verification code. Check the delivery configuration and try again.')
      });
  }

  verifyCode(): void {
    if (this.codeForm.invalid || this.busy()) {
      this.codeForm.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.http.post<CustomerTokenResponse>('/api/v1/auth/customer/otp/verify', {
      channel: this.channel(),
      contact: this.destination(),
      code: this.codeForm.controls.code.value
    }).pipe(finalize(() => this.busy.set(false))).subscribe({
      next: response => {
        this.auth.setCustomerSession(response.access_token, response.refresh_token ?? '', response.expires_in);
        this.close.emit();
      },
      error: response => this.error.set(response?.error?.detail ?? 'Verification failed. The code may have expired.')
    });
  }

  resetCode(): void {
    this.codeSent.set(false);
    this.codeForm.reset({ code: '' });
    this.error.set('');
    this.message.set('');
  }
}
