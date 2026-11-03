import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
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
        <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
          <div>
            <p class="auth-eyebrow mb-1">YOUR UTSAV ACCOUNT</p>
            <h2 id="customer-auth-title" class="h4 mb-1">{{ mode() === 'register' ? 'Create your account' : 'Customer sign in' }}</h2>
            <p class="text-secondary small mb-0">Register and sign in securely without visiting the identity-provider login screen.</p>
          </div>
          <div class="btn-group btn-group-sm" role="group" aria-label="Customer account action">
            <button type="button" class="btn" [class.btn-success]="mode() === 'login'" [class.btn-outline-success]="mode() !== 'login'" (click)="mode.set('login')">Sign in</button>
            <button type="button" class="btn" [class.btn-success]="mode() === 'register'" [class.btn-outline-success]="mode() !== 'register'" (click)="mode.set('register')">Create account</button>
          </div>
        </div>

        @if (message()) {
          <div class="alert alert-success py-2" role="status">{{ message() }}</div>
        }
        @if (error()) {
          <div class="alert alert-danger py-2" role="alert">{{ error() }}</div>
        }

        @if (mode() === 'register') {
          <form [formGroup]="registrationForm" (ngSubmit)="register()" novalidate>
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label" for="customer-first-name">First name</label>
                <input id="customer-first-name" class="form-control" formControlName="firstName" autocomplete="given-name">
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label" for="customer-last-name">Last name (optional)</label>
                <input id="customer-last-name" class="form-control" formControlName="lastName" autocomplete="family-name">
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label" for="customer-register-email">Email address</label>
                <input id="customer-register-email" class="form-control" type="email" formControlName="email" autocomplete="email">
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label" for="customer-phone">Mobile number</label>
                <input id="customer-phone" class="form-control" formControlName="phoneNumber" autocomplete="tel" placeholder="+919876543210">
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label" for="customer-register-password">Password</label>
                <input id="customer-register-password" class="form-control" type="password" formControlName="password" autocomplete="new-password">
                <div class="form-text">Use at least 12 characters.</div>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label" for="customer-confirm-password">Confirm password</label>
                <input id="customer-confirm-password" class="form-control" type="password" formControlName="confirmPassword" autocomplete="new-password">
              </div>
            </div>
            <button class="btn btn-success mt-3" type="submit" [disabled]="busy() || registrationForm.invalid"> {{ busy() ? 'Creating account…' : 'Create customer account' }} </button>
          </form>
        } @else {
          <form [formGroup]="loginForm" (ngSubmit)="login()" novalidate>
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label" for="customer-login-email">Email address</label>
                <input id="customer-login-email" class="form-control" type="email" formControlName="email" autocomplete="username">
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label" for="customer-login-password">Password</label>
                <input id="customer-login-password" class="form-control" type="password" formControlName="password" autocomplete="current-password">
              </div>
            </div>
            <button class="btn btn-success mt-3" type="submit" [disabled]="busy() || loginForm.invalid">{{ busy() ? 'Signing in…' : 'Sign in to your account' }}</button>
          </form>
        }
        <p class="small text-secondary mt-3 mb-0">Administrator? Use the separate administrator sign-in in the page header.</p>
      </section>
    }
  `,
  styles: [`
    .auth-panel { background: #fff; border: 1px solid #e4e9e5; border-radius: 1rem; padding: 1.25rem; margin: 1.5rem 0; }
    .auth-eyebrow { color: #8b6a2c; font-size: .72rem; font-weight: 700; letter-spacing: .16em; }
  `]
})
export class CustomerAuthComponent {
  readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);

  readonly mode = signal<'login' | 'register'>('register');
  readonly busy = signal(false);
  readonly error = signal('');
  readonly message = signal('');

  readonly registrationForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', Validators.maxLength(100)],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^\\+?[1-9][0-9]{7,14}$/)]],
    password: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(72)]],
    confirmPassword: ['', Validators.required]
  });

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  register(): void {
    if (this.registrationForm.invalid || this.busy()) {
      this.registrationForm.markAllAsTouched();
      return;
    }
    const { confirmPassword, ...request } = this.registrationForm.getRawValue();
    if (request.password !== confirmPassword) {
      this.error.set('The passwords do not match.');
      return;
    }
    this.beginRequest();
    this.http.post('/api/v1/auth/customer/register', request)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => {
          this.message.set('Your account has been created. Sign in using your email and password.');
          this.error.set('');
          this.loginForm.patchValue({ email: request.email, password: '' });
          this.registrationForm.reset();
          this.mode.set('login');
        },
        error: response => this.error.set(response?.error?.detail ?? response?.error?.message ?? 'Account creation failed. Check whether this email is already registered.')
      });
  }

  login(): void {
    if (this.loginForm.invalid || this.busy()) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.beginRequest();
    this.http.post<CustomerTokenResponse>('/api/v1/auth/customer/login', this.loginForm.getRawValue())
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: response => {
          this.auth.setCustomerSession(response.access_token, response.refresh_token ?? '', response.expires_in);
          this.error.set('');
          this.message.set('');
        },
        error: response => this.error.set(response?.error?.detail ?? response?.error?.message ?? 'Sign-in failed. Check your email and password.')
      });
  }

  private beginRequest(): void {
    this.error.set('');
    this.message.set('');
    this.busy.set(true);
  }
}
