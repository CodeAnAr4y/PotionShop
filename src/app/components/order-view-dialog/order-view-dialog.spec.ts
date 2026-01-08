import { Component, TemplateRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderViewDialog } from './order-view-dialog';
import { PotionOrder } from '../../models/order.model';
import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';

beforeAll(() => {
  registerLocaleData(localeRu, 'ru');
});

// Host component for testing input signals
@Component({
  standalone: true,
  imports: [OrderViewDialog],
  template: `
    <app-order-view-dialog
      [visible]="visible"
      [order]="order"
      (visibleChange)="onVisibleChange($event)"
      (edit)="onEdit($event)"
    />
  `,
})
class TestHostComponent {
  visible = false;
  order: PotionOrder | null = null;
  visibleChanged = false;
  editedOrder: PotionOrder | null = null;

  onVisibleChange(value: boolean) {
    this.visible = value;
    this.visibleChanged = true;
  }

  onEdit(order: PotionOrder) {
    this.editedOrder = order;
  }
}

const mockOrder: PotionOrder = {
  id: 1,
  potionNumber: '-TEST-001',
  customerName: 'Тестовый маг',
  orderDate: new Date('2026-01-01'),
  dueDate: new Date('2026-01-10'),
  deliveryAddress: 'Тестовый адрес доставки',
  deliveryMethod: 'Сова',
  paymentMethod: 'Золотые монеты',
  status: 'В работе',
  notes: 'Тестовое примечание',
  ingredients: [
    { id: 1, name: 'Корень мандрагоры', quantity: 10, unit: 'г', pricePerUnit: 50 },
    { id: 2, name: 'Слеза феникса', quantity: 2, unit: 'капля', pricePerUnit: 500 },
    { id: 3, name: 'Лунная пыль', quantity: 5, unit: 'г', pricePerUnit: 200 },
  ],
  totalCost: 2500,
};

describe('OrderViewDialog (isolated)', () => {
  let component: OrderViewDialog;
  let fixture: ComponentFixture<OrderViewDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderViewDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderViewDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should return "info" for status "Новый"', () => {
    expect(component.getStatusSeverity('Новый')).toBe('info');
  });

  it('should return "warn" for status "В работе"', () => {
    expect(component.getStatusSeverity('В работе')).toBe('warn');
  });

  it('should return "success" for status "Готов"', () => {
    expect(component.getStatusSeverity('Готов')).toBe('success');
  });

  it('should return "secondary" for status "Доставлен"', () => {
    expect(component.getStatusSeverity('Доставлен')).toBe('secondary');
  });

  it('should return "danger" for status "Отменён"', () => {
    expect(component.getStatusSeverity('Отменён')).toBe('danger');
  });
});

describe('OrderViewDialog (within host component)', () => {
  let hostFixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
  });

  it('should display order data', () => {
    hostComponent.visible = true;
    hostComponent.order = mockOrder;
    hostFixture.detectChanges();

    expect(hostFixture.nativeElement.textContent).toContain('Тестовый маг');
  });

  it('should display ingredients', () => {
    hostComponent.visible = true;
    hostComponent.order = mockOrder;
    hostFixture.detectChanges();

    expect(hostFixture.nativeElement.textContent).toContain('Корень мандрагоры');
  });
});