import { computed, Injectable, signal } from '@angular/core';
import { AVAILABLE_INGREDIENTS, Ingredient, PotionOrder } from '../models/order.model';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private orderSignal = signal<PotionOrder[]>(this.loadFromStorage());
  readonly orders = this.orderSignal.asReadonly();
  readonly totalOrders = computed(() => this.orderSignal().length);
  readonly totalRevenue = computed(() =>
    this.orderSignal().reduce((sum, order) => sum + (order.totalCost || 0), 0)
  );
  readonly pendingOrders = computed(
    () =>
      this.orderSignal().filter((order) => order.status === 'Новый' || order.status === 'В работе')
        .length
  );

  constructor() {
    if (this.orderSignal().length === 0) {
      this.initializeDemoData();
    }
  }

  // Orders CRUD
  getOrders(): PotionOrder[] {
    return this.orderSignal();
  }

  getOrderById(id: number): PotionOrder | null {
    return this.orderSignal().find((order) => order.id === id) ?? null;
  }

  addOrder(order: Omit<PotionOrder, 'id' | 'totalCost'>): PotionOrder {
    const newOrder: PotionOrder = {
      ...order,
      id: this.generateId(),
      totalCost: this.calculateTotalCost(order.ingredients),
    };

    this.orderSignal.update((orders) => [...orders, newOrder]);
    this.saveToStorage();

    return newOrder;
  }

  updateOrder(id: number, updates: Partial<PotionOrder>): boolean {
    const index = this.orderSignal().findIndex((order) => order.id === id);

    if (index === -1) {
      return false;
    }

    this.orderSignal.update((orders) => {
      const newOrders = [...orders];
      newOrders[index] = {
        ...newOrders[index],
        ...updates,
        totalCost: updates.ingredients
          ? this.calculateTotalCost(updates.ingredients)
          : newOrders[index].totalCost,
      };
      return newOrders;
    });

    this.saveToStorage();
    return true;
  }

  deleteOrder(id: number): boolean {
    const initialLength = this.orderSignal().length;

    this.orderSignal.update((orders) => orders.filter((order) => order.id !== id));

    if (this.orderSignal().length < initialLength) {
      this.saveToStorage();
      return true;
    }

    return false;
  }

  changeOrderStatus(id: number, status: PotionOrder['status']): boolean {
    return this.updateOrder(id, { status });
  }

  calculateTotalCost(ingredients: Ingredient[]): number {
    return ingredients.reduce((sum, ing) => sum + ing.quantity * ing.pricePerUnit, 0);
  }

  getAvailableIngredients(): typeof AVAILABLE_INGREDIENTS {
    return AVAILABLE_INGREDIENTS;
  }

  generatePotionNumber(): string {
    const prefix = 'PS';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  generateId(): number {
    const orders = this.orderSignal();
    return orders.length > 0 ? Math.max(...orders.map((order) => order.id)) + 1 : 1;
  }

  saveToStorage(): void {
    try {
      const data = JSON.stringify(this.orderSignal());
      localStorage.setItem('potion_orders', data);
    } catch (e) {
      console.error('Not able to save data to local storage :(', e);
    }
  }

  private loadFromStorage(): PotionOrder[] {
    try {
      const data = localStorage.getItem('potion_orders');
      if (data) {
        const orders = JSON.parse(data);
        return orders.map((order: PotionOrder) => ({
          ...order,
          orderDate: new Date(order.orderDate),
          dueDate: new Date(order.dueDate),
        }));
      }
    } catch (e) {
      console.error('Unavailable to load orders from local storage :(', e);
    }
    return [];
  }

  // DEMO data
  private initializeDemoData(): void {
    const demoOrders: Omit<PotionOrder, 'id' | 'totalCost'>[] = [
      {
        potionNumber: 'PS-DEMO-001',
        customerName: 'Гарри Поттер',
        orderDate: new Date(2026, 0, 1),
        dueDate: new Date(2026, 0, 10),
        deliveryAddress: 'Хогвартс, Гриффиндорская башня, комната 7',
        deliveryMethod: 'Сова',
        paymentMethod: 'Золотые монеты',
        status: 'В работе',
        notes: 'Срочный заказ для подготовки к экзамену',
        ingredients: [
          { id: 1, name: 'Корень мандрагоры', quantity: 50, unit: 'г', pricePerUnit: 50 },
          { id: 2, name: 'Слеза феникса', quantity: 3, unit: 'капля', pricePerUnit: 500 },
          { id: 3, name: 'Лунная пыль', quantity: 20, unit: 'г', pricePerUnit: 200 },
        ],
      },
      {
        potionNumber: 'PS-DEMO-002',
        customerName: 'Гермиона Грейнджер',
        orderDate: new Date(2026, 0, 3),
        dueDate: new Date(2026, 0, 15),
        deliveryAddress: 'Министерство Магии, Отдел регулирования магических существ',
        deliveryMethod: 'Телепортация',
        paymentMethod: 'Магический кристалл',
        status: 'Новый',
        ingredients: [
          { id: 1, name: 'Порошок безоара', quantity: 30, unit: 'г', pricePerUnit: 250 },
          { id: 2, name: 'Экстракт белладонны', quantity: 15, unit: 'мл', pricePerUnit: 120 },
          { id: 3, name: 'Волос единорога', quantity: 2, unit: 'шт', pricePerUnit: 300 },
          { id: 4, name: 'Роса утренней зари', quantity: 10, unit: 'мл', pricePerUnit: 220 },
        ],
      },
      {
        potionNumber: 'PS-DEMO-003',
        customerName: 'Северус Снейп',
        orderDate: new Date(2025, 11, 28),
        dueDate: new Date(2026, 0, 5),
        deliveryAddress: 'Хогвартс, Подземелья, Кабинет зельеварения',
        deliveryMethod: 'Самовывоз',
        paymentMethod: 'Бартер',
        status: 'Готов',
        notes: 'Редкие ингредиенты для исследований',
        ingredients: [
          { id: 1, name: 'Кровь дракона', quantity: 5, unit: 'мл', pricePerUnit: 1000 },
          { id: 2, name: 'Пепел вампира', quantity: 3, unit: 'щепотка', pricePerUnit: 800 },
          { id: 3, name: 'Эссенция тумана', quantity: 25, unit: 'мл', pricePerUnit: 350 },
        ],
      },

      // +10 демонстрационных заказов
      {
        potionNumber: 'PS-DEMO-004',
        customerName: 'Рон Уизли',
        orderDate: new Date(2026, 0, 4),
        dueDate: new Date(2026, 0, 12),
        deliveryAddress: 'Нора, Около Оттери-Сент-Кэтчпол, Девон',
        deliveryMethod: 'Метла-курьер',
        paymentMethod: 'В рассрочку',
        status: 'В работе',
        notes: 'Пожалуйста, без слишком резкого запаха.',
        ingredients: [
          { id: 1, name: 'Сушёная полынь', quantity: 80, unit: 'г', pricePerUnit: 30 },
          { id: 2, name: 'Экстракт белладонны', quantity: 10, unit: 'мл', pricePerUnit: 120 },
          { id: 3, name: 'Лунная пыль', quantity: 10, unit: 'г', pricePerUnit: 200 },
        ],
      },
      {
        potionNumber: 'PS-DEMO-005',
        customerName: 'Луна Лавгуд',
        orderDate: new Date(2026, 0, 5),
        dueDate: new Date(2026, 0, 20),
        deliveryAddress: 'Дом Лавгудов, неподалёку от Оттери-Сент-Кэтчпол',
        deliveryMethod: 'Сова',
        paymentMethod: 'Эликсир обмена',
        status: 'Новый',
        notes: 'Нужен мягкий вкус и мерцание в полумраке.',
        ingredients: [
          { id: 1, name: 'Роса утренней зари', quantity: 20, unit: 'мл', pricePerUnit: 220 },
          { id: 2, name: 'Лунная пыль', quantity: 25, unit: 'г', pricePerUnit: 200 },
          { id: 3, name: 'Перо гиппогрифа', quantity: 1, unit: 'шт', pricePerUnit: 150 },
        ],
      },
      {
        potionNumber: 'PS-DEMO-006',
        customerName: 'Невилл Долгопупс',
        orderDate: new Date(2026, 0, 6),
        dueDate: new Date(2026, 0, 18),
        deliveryAddress: 'Хогвартс, Теплицы, рабочий стол №3',
        deliveryMethod: 'Самовывоз',
        paymentMethod: 'Золотые монеты',
        status: 'Новый',
        notes: 'Для практикума по травологии: требуется точная дозировка.',
        ingredients: [
          { id: 1, name: 'Корень мандрагоры', quantity: 40, unit: 'г', pricePerUnit: 50 },
          { id: 2, name: 'Сушёная полынь', quantity: 60, unit: 'г', pricePerUnit: 30 },
          { id: 3, name: 'Серебряная стружка', quantity: 5, unit: 'г', pricePerUnit: 180 },
        ],
      },
      {
        potionNumber: 'PS-DEMO-007',
        customerName: 'Драко Малфой',
        orderDate: new Date(2026, 0, 7),
        dueDate: new Date(2026, 0, 9),
        deliveryAddress: 'Поместье Малфоев, Уилтшир',
        deliveryMethod: 'Портал',
        paymentMethod: 'Магический кристалл',
        status: 'В работе',
        notes: 'Доставка строго конфиденциально. Без отметок на упаковке.',
        ingredients: [
          { id: 1, name: 'Слеза феникса', quantity: 2, unit: 'капля', pricePerUnit: 500 },
          { id: 2, name: 'Серебряная стружка', quantity: 20, unit: 'г', pricePerUnit: 180 },
          { id: 3, name: 'Эссенция тумана', quantity: 30, unit: 'мл', pricePerUnit: 350 },
          { id: 4, name: 'Волос единорога', quantity: 1, unit: 'шт', pricePerUnit: 300 },
        ],
      },
      {
        potionNumber: 'PS-DEMO-008',
        customerName: 'Минерва Макгонагалл',
        orderDate: new Date(2026, 0, 2),
        dueDate: new Date(2026, 0, 14),
        deliveryAddress: 'Хогвартс, Кабинет трансфигурации',
        deliveryMethod: 'Сова',
        paymentMethod: 'Бартер',
        status: 'Готов',
        notes: 'Настаивать ровно до заката, затем остудить на камне.',
        ingredients: [
          { id: 1, name: 'Глаз тритона', quantity: 2, unit: 'шт', pricePerUnit: 90 },
          { id: 2, name: 'Роса утренней зари', quantity: 15, unit: 'мл', pricePerUnit: 220 },
          { id: 3, name: 'Серебряная стружка', quantity: 8, unit: 'г', pricePerUnit: 180 },
        ],
      },
      {
        potionNumber: 'PS-DEMO-009',
        customerName: 'Рубеус Хагрид',
        orderDate: new Date(2026, 0, 8),
        dueDate: new Date(2026, 0, 25),
        deliveryAddress: 'Хогвартс, Хижина лесничего у Запретного леса',
        deliveryMethod: 'Метла-курьер',
        paymentMethod: 'Золотые монеты',
        status: 'В работе',
        notes: 'Побольше объёма. Для “ухода за зверюшками”.',
        ingredients: [
          { id: 1, name: 'Перо гиппогрифа', quantity: 3, unit: 'шт', pricePerUnit: 150 },
          { id: 2, name: 'Кровь дракона', quantity: 10, unit: 'мл', pricePerUnit: 1000 },
          { id: 3, name: 'Сушёная полынь', quantity: 120, unit: 'г', pricePerUnit: 30 },
        ],
      },
      {
        potionNumber: 'PS-DEMO-010',
        customerName: 'Гораций Слизнорт',
        orderDate: new Date(2026, 0, 9),
        dueDate: new Date(2026, 0, 19),
        deliveryAddress: 'Хогвартс, Комната профессора Слизнорта',
        deliveryMethod: 'Самовывоз',
        paymentMethod: 'Магический кристалл',
        status: 'Новый',
        notes: 'Партия для дегустации на вечере. Вкус должен быть “с ноткой амбры”.',
        ingredients: [
          { id: 1, name: 'Порошок безоара', quantity: 15, unit: 'г', pricePerUnit: 250 },
          { id: 2, name: 'Экстракт белладонны', quantity: 20, unit: 'мл', pricePerUnit: 120 },
          { id: 3, name: 'Роса утренней зари', quantity: 10, unit: 'мл', pricePerUnit: 220 },
          { id: 4, name: 'Лунная пыль', quantity: 12, unit: 'г', pricePerUnit: 200 },
        ],
      },
      {
        potionNumber: 'PS-DEMO-011',
        customerName: 'Нимфадора Тонкс',
        orderDate: new Date(2026, 0, 10),
        dueDate: new Date(2026, 0, 13),
        deliveryAddress: 'Штаб Аврората, Министерство Магии',
        deliveryMethod: 'Телепортация',
        paymentMethod: 'Золотые монеты',
        status: 'Доставлен',
        notes: 'Нужна упаковка, которая не бьётся при перемещении.',
        ingredients: [
          { id: 1, name: 'Эссенция тумана', quantity: 40, unit: 'мл', pricePerUnit: 350 },
          { id: 2, name: 'Глаз тритона', quantity: 1, unit: 'шт', pricePerUnit: 90 },
          { id: 3, name: 'Серебряная стружка', quantity: 6, unit: 'г', pricePerUnit: 180 },
        ],
      },
      {
        potionNumber: 'PS-DEMO-012',
        customerName: 'Флёр Делакур',
        orderDate: new Date(2026, 0, 11),
        dueDate: new Date(2026, 0, 21),
        deliveryAddress: 'Коттедж Ракушка, окраина Тинворта',
        deliveryMethod: 'Сова',
        paymentMethod: 'Эликсир обмена',
        status: 'В работе',
        notes: 'Лёгкий аромат цветов, без горечи.',
        ingredients: [
          { id: 1, name: 'Волос единорога', quantity: 2, unit: 'шт', pricePerUnit: 300 },
          { id: 2, name: 'Роса утренней зари', quantity: 25, unit: 'мл', pricePerUnit: 220 },
          { id: 3, name: 'Лунная пыль', quantity: 8, unit: 'г', pricePerUnit: 200 },
        ],
      },
      {
        potionNumber: 'PS-DEMO-013',
        customerName: 'Сириус Блэк',
        orderDate: new Date(2026, 0, 12),
        dueDate: new Date(2026, 0, 16),
        deliveryAddress: 'Площадь Гриммо, 12',
        deliveryMethod: 'Портал',
        paymentMethod: 'Бартер',
        status: 'Отменён',
        notes: 'Отменено заказчиком: “нашёл старые запасы в кладовке”.',
        ingredients: [
          { id: 1, name: 'Пепел вампира', quantity: 2, unit: 'щепотка', pricePerUnit: 800 },
          { id: 2, name: 'Эссенция тумана', quantity: 15, unit: 'мл', pricePerUnit: 350 },
          { id: 3, name: 'Жало скорпиона', quantity: 4, unit: 'шт', pricePerUnit: 80 },
        ],
      },
    ];

    demoOrders.forEach((order) => this.addOrder(order));
  }

  clearAll(): void {
    this.orderSignal.set([]);
    localStorage.removeItem('potion_orders');
  }
}
