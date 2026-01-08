import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderForm } from './order-form';
import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';

beforeAll(() => {
  registerLocaleData(localeRu, 'ru');
});

describe('OrderForm', () => {
  let component: OrderForm;
  let fixture: ComponentFixture<OrderForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
