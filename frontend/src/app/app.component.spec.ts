import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { ProductService } from './catalogue/product.service';
import { AuthService } from './auth/auth.service';
import { CartService } from './cart/cart.service';
import { EMPTY_CART } from './cart/cart.model';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: ProductService, useValue: { listActive: jasmine.createSpy('listActive').and.returnValue(of([])) } },
        { provide: AuthService, useValue: {
          isAuthenticated: false,
          username: null,
          login: jasmine.createSpy('login'),
          logout: jasmine.createSpy('logout')
        } },
        { provide: CartService, useValue: {
          cart: signal(EMPTY_CART),
          loading: signal(false),
          error: signal(''),
          load: jasmine.createSpy('load'),
          addOne: jasmine.createSpy('addOne'),
          remove: jasmine.createSpy('remove'),
          clear: jasmine.createSpy('clear')
        } }
      ]
    }).compileComponents();
  });

  it('renders the Utsav Crackers landing content and guest sign-in action', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('UTSAV CRACKERS');
    expect(fixture.nativeElement.textContent).toContain('Celebrate with care.');
    expect(fixture.nativeElement.textContent).toContain('Explore our products');
    expect(fixture.nativeElement.textContent).toContain('Sign in');
  });
});
