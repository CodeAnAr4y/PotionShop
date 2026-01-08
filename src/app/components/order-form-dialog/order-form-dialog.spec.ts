import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderFormDialog } from './order-form-dialog';
import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';

beforeAll(() => {
  registerLocaleData(localeRu, 'ru');
});

describe('OrderFormDialog', () => {
  let component: OrderFormDialog;
  let fixture: ComponentFixture<OrderFormDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderFormDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderFormDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
