import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { ProductService } from './catalogue/product.service';
import { CategoryService } from './catalogue/category.service';
import { AuthService } from './auth/auth.service';
import { CartService } from './cart/cart.service';
import { EMPTY_CART } from './cart/cart.model';
import { CustomerAddressService } from './customer-address/customer-address.service';
import { InventoryService } from './inventory/inventory.service';
import { FireworksPolicyService } from './compliance/fireworks-policy.service';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: HttpClient, useValue: { post: jasmine.createSpy('post').and.returnValue(of({})) } },
        { provide: ProductService, useValue: {
          listActive: jasmine.createSpy('listActive').and.returnValue(of([])),
          create: jasmine.createSpy('create').and.returnValue(of({})),
          update: jasmine.createSpy('update').and.returnValue(of({})),
          deactivate: jasmine.createSpy('deactivate').and.returnValue(of(void 0))
        } },
        { provide: CategoryService, useValue: {
          listActive: jasmine.createSpy('listActive').and.returnValue(of([])),
          create: jasmine.createSpy('create').and.returnValue(of({}))
        } },
        { provide: InventoryService, useValue: {
          listBalances: jasmine.createSpy('listBalances').and.returnValue(of([])),
          adjust: jasmine.createSpy('adjust').and.returnValue(of({})),
          listMovements: jasmine.createSpy('listMovements').and.returnValue(of([]))
        } },
        { provide: FireworksPolicyService, useValue: {
          list: jasmine.createSpy('list').and.returnValue(of([])),
          create: jasmine.createSpy('create').and.returnValue(of({})),
          approve: jasmine.createSpy('approve').and.returnValue(of({})),
          revoke: jasmine.createSpy('revoke').and.returnValue(of({}))
        } },
        { provide: AuthService, useValue: {
          isAuthenticated: false,
          username: null,
          subject: null,
          hasRole: jasmine.createSpy('hasRole').and.returnValue(false),
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
        } },
        { provide: CustomerAddressService, useValue: {
          list: jasmine.createSpy('list').and.returnValue(of([])),
          create: jasmine.createSpy('create').and.returnValue(of({})),
          update: jasmine.createSpy('update').and.returnValue(of({})),
          makeDefault: jasmine.createSpy('makeDefault').and.returnValue(of({})),
          remove: jasmine.createSpy('remove').and.returnValue(of(void 0)),
          checkFireworksEligibility: jasmine.createSpy('checkFireworksEligibility').and.returnValue(of({}))
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
    expect(fixture.nativeElement.textContent).toContain('Administrator sign in');
  });
});
