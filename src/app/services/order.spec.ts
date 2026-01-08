import { TestBed } from '@angular/core/testing';
import { OrderService } from './order';
import { PotionOrder, Ingredient } from '../models/order.model';

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [OrderService],
    });

    service = TestBed.inject(OrderService);
    service.clearAll();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('creating a service', () => {
    it('must be created', () => {
      expect(service).toBeTruthy();
    });

    it('should be initialized with empty list of orders after clear', () => {
      expect(service.getOrders().length).toBe(0);
    });
  });

  describe('add order', () => {
    it('must add new order', () => {
      const newOrder = createMockOrder();

      const result = service.addOrder(newOrder);

      expect(result.id).toBeDefined();
      expect(result.potionNumber).toBe(newOrder.potionNumber);
      expect(service.getOrders().length).toBe(1);
    });

    it('should automatically count totalCost on adding', () => {
      const ingredients: Ingredient[] = [
        { id: 1, name: 'Ингредиент 1', quantity: 10, unit: 'г', pricePerUnit: 100 },
        { id: 2, name: 'Ингредиент 2', quantity: 5, unit: 'мл', pricePerUnit: 200 },
        { id: 3, name: 'Ингредиент 3', quantity: 2, unit: 'шт', pricePerUnit: 50 },
      ];

      const newOrder = createMockOrder(ingredients);
      const result = service.addOrder(newOrder);

      expect(result.totalCost).toBe(2100);
    });

    it('must initialize unique ID', () => {
      const order1 = service.addOrder(createMockOrder());
      const order2 = service.addOrder(createMockOrder());
      const order3 = service.addOrder(createMockOrder());

      expect(order1.id).not.toBe(order2.id);
      expect(order2.id).not.toBe(order3.id);
      expect(order1.id).not.toBe(order3.id);
    });
  });

  describe('getting orders', () => {
    it('must return all the orders', () => {
      service.addOrder(createMockOrder());
      service.addOrder(createMockOrder());

      const orders = service.getOrders();

      expect(orders.length).toBe(2);
    });

    it('must find order by ID', () => {
      const added = service.addOrder(createMockOrder());

      const found = service.getOrderById(added.id);

      expect(found).toBeDefined();
      expect(found!.id).toBe(added.id);
    });
  });

  describe('Order update', () => {
    it('must update existent order', () => {
      const added = service.addOrder(createMockOrder());

      const result = service.updateOrder(added.id, {
        customerName: 'New name',
        status: 'В работе',
      });

      expect(result).toBe(true);
      const updated = service.getOrderById(added.id);
      expect(updated!.customerName).toBe('New name');
      expect(updated!.status).toBe('В работе');
    });

    it('must return false when updating non-existent order', () => {
      const result = service.updateOrder(99999, { customerName: 'Test' });

      expect(result).toBe(false);
    });

    it('must calculate totalCost when ingredients updated', () => {
      const added = service.addOrder(createMockOrder());

      const newIngredients: Ingredient[] = [
        { id: 1, name: 'Новый', quantity: 1, unit: 'шт', pricePerUnit: 1000 },
        { id: 2, name: 'Ещё один', quantity: 1, unit: 'шт', pricePerUnit: 500 },
        { id: 3, name: 'Третий', quantity: 1, unit: 'шт', pricePerUnit: 300 },
      ];

      service.updateOrder(added.id, { ingredients: newIngredients });

      const updated = service.getOrderById(added.id);
      expect(updated!.totalCost).toBe(1800);
    });
  });

  describe('delete order', () => {
    it('must delete existent order', () => {
      const added = service.addOrder(createMockOrder());

      const result = service.deleteOrder(added.id);

      expect(result).toBe(true);
      expect(service.getOrders().length).toBe(0);
    });

    it('must return false when deleting non-existent order', () => {
      const result = service.deleteOrder(99999);

      expect(result).toBe(false);
    });
  });

  describe('Change status', () => {
    it('must change order status', () => {
      const added = service.addOrder(createMockOrder());
      service.changeOrderStatus(added.id, 'Готов');
      const updated = service.getOrderById(added.id);
      expect(updated!.status).toBe('Готов');
    });
  });

  describe('Cost calculation', () => {
    it('must corrctly calculate order cost', () => {
      const ingredients: Ingredient[] = [
        { id: 1, name: 'A', quantity: 3, unit: 'г', pricePerUnit: 100 },
        { id: 2, name: 'B', quantity: 2, unit: 'мл', pricePerUnit: 150 },
        { id: 3, name: 'C', quantity: 5, unit: 'шт', pricePerUnit: 50 },
      ];
      const total = service.calculateTotalCost(ingredients);
      expect(total).toBe(850);
    });

    it('must return 0 for empty list', () => {
      const total = service.calculateTotalCost([]);

      expect(total).toBe(0);
    });
  });

  describe('generate potion name', () => {
    it('should generate unique name', () => {
      const num1 = service.generatePotionNumber();
      const num2 = service.generatePotionNumber();

      expect(num1).not.toBe(num2);
    });

    it('must start from PS-', () => {
      const num = service.generatePotionNumber();

      expect(num.startsWith('PS-')).toBe(true);
    });
  });

  describe('Computed property', () => {
    it('must correctly count totalOrders', () => {
      service.addOrder(createMockOrder());
      service.addOrder(createMockOrder());

      expect(service.totalOrders()).toBe(2);
    });

    it('must correctly count pendingOrders', () => {
      const order1 = createMockOrder();
      order1.status = 'Новый';
      service.addOrder(order1);

      const order2 = createMockOrder();
      order2.status = 'В работе';
      service.addOrder(order2);

      const order3 = createMockOrder();
      order3.status = 'Готов';
      service.addOrder(order3);

      expect(service.pendingOrders()).toBe(2);
    });
  });

  // generate mock-order
  function createMockOrder(
    customIngredients?: Ingredient[]
  ): Omit<PotionOrder, 'id' | 'totalCost'> {
    return {
      potionNumber: 'TEST-001',
      customerName: 'Test client',
      orderDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      deliveryAddress: 'test address',
      deliveryMethod: 'Сова',
      paymentMethod: 'Золотые монеты',
      status: 'Новый',
      ingredients: customIngredients || [
        { id: 1, name: 'test 1', quantity: 1, unit: 'г', pricePerUnit: 100 },
        { id: 2, name: 'test 2', quantity: 1, unit: 'мл', pricePerUnit: 100 },
        { id: 3, name: 'test 3', quantity: 1, unit: 'шт', pricePerUnit: 100 },
      ],
    };
  }
});
