export interface Ingredient {
    id: number;
    name: string;
    quantity: number;
    unit: IngredientUnit;
    pricePerUnit: number;
  }
  
  export type IngredientUnit = 'г' | 'мл' | 'шт' | 'щепотка' | 'капля';
  
  export type DeliveryMethod = 'Сова' | 'Телепортация' | 'Метла-курьер' | 'Портал' | 'Самовывоз';
  
  export type PaymentMethod = 'Золотые монеты' | 'Магический кристалл' | 'Эликсир обмена' | 'Бартер' | 'В рассрочку';
  
  export type OrderStatus = 'Новый' | 'В работе' | 'Готов' | 'Доставлен' | 'Отменён';
  
  export interface PotionOrder {
    id: number;
    potionNumber: string;
    customerName: string;
    orderDate: Date;
    dueDate: Date;
    deliveryAddress: string;
    deliveryMethod: DeliveryMethod;
    paymentMethod: PaymentMethod;
    ingredients: Ingredient[];
    status: OrderStatus;
    notes?: string;
    totalCost?: number;
  }
  
  export const AVAILABLE_INGREDIENTS: { name: string; defaultPrice: number; unit: IngredientUnit }[] = [
    { name: 'Корень мандрагоры', defaultPrice: 50, unit: 'г' },
    { name: 'Слеза феникса', defaultPrice: 500, unit: 'капля' },
    { name: 'Лунная пыль', defaultPrice: 200, unit: 'г' },
    { name: 'Кровь дракона', defaultPrice: 1000, unit: 'мл' },
    { name: 'Перо гиппогрифа', defaultPrice: 150, unit: 'шт' },
    { name: 'Жало скорпиона', defaultPrice: 80, unit: 'шт' },
    { name: 'Волос единорога', defaultPrice: 300, unit: 'шт' },
    { name: 'Порошок безоара', defaultPrice: 250, unit: 'г' },
    { name: 'Экстракт белладонны', defaultPrice: 120, unit: 'мл' },
    { name: 'Сушёная полынь', defaultPrice: 30, unit: 'г' },
    { name: 'Глаз тритона', defaultPrice: 90, unit: 'шт' },
    { name: 'Серебряная стружка', defaultPrice: 180, unit: 'г' },
    { name: 'Эссенция тумана', defaultPrice: 350, unit: 'мл' },
    { name: 'Пепел вампира', defaultPrice: 800, unit: 'щепотка' },
    { name: 'Роса утренней зари', defaultPrice: 220, unit: 'мл' }
  ];
  
  export const DELIVERY_METHODS: DeliveryMethod[] = [
    'Сова',
    'Телепортация',
    'Метла-курьер',
    'Портал',
    'Самовывоз'
  ];
  
  export const PAYMENT_METHODS: PaymentMethod[] = [
    'Золотые монеты',
    'Магический кристалл',
    'Эликсир обмена',
    'Бартер',
    'В рассрочку'
  ];
  
  export const INGREDIENT_UNITS: IngredientUnit[] = ['г', 'мл', 'шт', 'щепотка', 'капля'];