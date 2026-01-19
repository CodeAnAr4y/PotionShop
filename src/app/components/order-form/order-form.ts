import {
  Component,
  OnInit,
  OnDestroy,
  output,
  input,
  signal,
  computed,
  effect,
  viewChildren,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  FormArray,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Subscription } from 'rxjs';

import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';

import {
  PotionOrder,
  Ingredient,
  DeliveryMethod,
  PaymentMethod,
  DELIVERY_METHODS,
  PAYMENT_METHODS,
  IngredientUnit,
  AVAILABLE_INGREDIENTS,
} from '../../models/order.model';
import { OrderService } from '../../services/order';
import { IngredientInput } from '../ingredient-input/ingredient-input';

function dueDateAfterOrderDate(control: AbstractControl): ValidationErrors | null {
  const formGroup = control as FormGroup;
  const orderDate = formGroup.get('orderDate')?.value;
  const dueDate = formGroup.get('dueDate')?.value;

  if (orderDate && dueDate && new Date(dueDate) <= new Date(orderDate)) {
    return { dueDateInvalid: true };
  }
  return null;
}

function minIngredients(min: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    const formArray = control as FormArray;
    if (formArray.length < min) {
      return { minIngredients: { required: min, actual: formArray.length } };
    }
    return null;
  };
}

type IngredientGroup = FormGroup<{
  id: FormControl<number>;
  name: FormControl<string>;
  quantity: FormControl<number | null>;
  unit: FormControl<IngredientUnit>;
  pricePerUnit: FormControl<number | null>;
}>;

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    DatePickerModule,
    SelectModule,
    ButtonModule,
    CardModule,
    DividerModule,
    TooltipModule,
    MessageModule,
    IngredientInput,
  ],
  templateUrl: './order-form.html',
  styleUrl: './order-form.css',
})
export class OrderForm implements OnInit, OnDestroy {
  order = input<PotionOrder | null>(null);
  saved = output<PotionOrder>();
  cancelled = output<void>();

  ingredientInputs = viewChildren(IngredientInput);

  editMode = signal(false);
  isSubmitting = signal(false);

  readonly deliveryMethods: DeliveryMethod[] = DELIVERY_METHODS;
  readonly paymentMethods: PaymentMethod[] = PAYMENT_METHODS;
  readonly statusOptions = ['Новый', 'В работе', 'Готов', 'Доставлен', 'Отменён'];

  form = new FormGroup(
    {
      potionNumber: new FormControl<string>('', [Validators.required]),
      customerName: new FormControl<string>('', [Validators.required, Validators.minLength(2)]),
      orderDate: new FormControl<Date>(new Date(), [Validators.required]),
      dueDate: new FormControl<Date | null>(null, [Validators.required]),
      deliveryAddress: new FormControl<string>('', [Validators.required, Validators.minLength(10)]),
      deliveryMethod: new FormControl<DeliveryMethod | null>(null, [Validators.required]),
      paymentMethod: new FormControl<PaymentMethod | null>(null, [Validators.required]),
      status: new FormControl<string>('Новый'),
      notes: new FormControl<string>(''),
      ingredients: new FormArray<IngredientGroup>([], [minIngredients(3)]),
    },
    { validators: dueDateAfterOrderDate }
  );

  private ingredientsVersion = signal(0);

  totalCost = computed(() => {
    this.ingredientsVersion();
    return this.ingredientsArray.controls.reduce((sum, group) => {
      const qty = group.controls.quantity.value ?? 0;
      const price = group.controls.pricePerUnit.value ?? 0;
      return sum + qty * price;
    }, 0);
  });

  minDueDate = computed(() => {
    const orderDate = this.form.controls.orderDate.value;
    if (orderDate) {
      const minDate = new Date(orderDate);
      minDate.setDate(minDate.getDate() + 1);
      return minDate;
    }
    return new Date();
  });

  availableIngredientsFor(index: number): { name: string; defaultPrice: number; unit: IngredientUnit }[] {
    const selectedNames = this.ingredientsArray.controls
      .map((c, i) => (i === index ? null : c.controls.name.value))
      .filter(Boolean);
  
    return AVAILABLE_INGREDIENTS.filter(
      ing => !selectedNames.includes(ing.name)
    );
  }

  private subscriptions: Subscription[] = [];

  constructor(private orderService: OrderService) {
    effect(() => {
      const orderData = this.order();
      if (orderData) {
        this.editMode.set(true);
        this.populateForm(orderData);
      } else {
        this.editMode.set(false);
        this.initNewOrder();
      }
    });
  }

  get ingredientsArray(): FormArray<IngredientGroup> {
    return this.form.controls.ingredients;
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.ingredientsArray.valueChanges.subscribe(() => {
        this.ingredientsVersion.update((v) => v + 1);
      })
    );

    if (!this.order()) {
      this.initNewOrder();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  trackByIndex(index: number): number {
    return index;
  }

  private createIngredientGroup(ing: Ingredient): IngredientGroup {
    return new FormGroup({
      id: new FormControl<number>(ing.id, { nonNullable: true }),
      name: new FormControl<string>(ing.name, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      quantity: new FormControl<number | null>(ing.quantity, [
        Validators.required,
        Validators.min(0.1),
      ]),
      unit: new FormControl<IngredientUnit>(ing.unit as IngredientUnit, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      pricePerUnit: new FormControl<number | null>(ing.pricePerUnit, [
        Validators.required,
        Validators.min(0),
      ]),
    });
  }

  private initNewOrder(): void {
    this.form.reset({
      potionNumber: this.orderService.generatePotionNumber(),
      customerName: '',
      orderDate: new Date(),
      dueDate: null,
      deliveryAddress: '',
      deliveryMethod: null,
      paymentMethod: null,
      status: 'Новый',
      notes: '',
    });

    this.ingredientsArray.clear();
    for (let i = 0; i < 3; i++) {
      this.addIngredient();
    }
  }

  private populateForm(order: PotionOrder): void {
    this.form.patchValue({
      potionNumber: order.potionNumber,
      customerName: order.customerName,
      orderDate: new Date(order.orderDate),
      dueDate: new Date(order.dueDate),
      deliveryAddress: order.deliveryAddress,
      deliveryMethod: order.deliveryMethod,
      paymentMethod: order.paymentMethod,
      status: order.status,
      notes: order.notes || '',
    });

    this.ingredientsArray.clear();
    order.ingredients.forEach((ing) => {
      this.ingredientsArray.push(this.createIngredientGroup(ing));
    });

    this.ingredientsVersion.update((v) => v + 1);
  }

  addIngredient(): void {
    const newIngredient: Ingredient = {
      id: Date.now() + Math.random(),
      name: '',
      quantity: 1,
      unit: 'г',
      pricePerUnit: 0,
    };

    this.ingredientsArray.push(this.createIngredientGroup(newIngredient));
    this.ingredientsVersion.update((v) => v + 1);
  }

  checkIngredientRemoval(index: number): void {
    setTimeout(() => {
      const inputs = this.ingredientInputs();
      if (inputs[index]?.removeRequested()) {
        this.removeIngredient(index);
      }
    }, 0);
  }

  removeIngredient(index: number): void {
    if (this.ingredientsArray.length > 1) {
      this.ingredientsArray.removeAt(index);
      this.ingredientsVersion.update((v) => v + 1);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.form.getRawValue();

    const orderData: Omit<PotionOrder, 'id' | 'totalCost'> = {
      potionNumber: formValue.potionNumber!,
      customerName: formValue.customerName!,
      orderDate: formValue.orderDate!,
      dueDate: formValue.dueDate!,
      deliveryAddress: formValue.deliveryAddress!,
      deliveryMethod: formValue.deliveryMethod!,
      paymentMethod: formValue.paymentMethod!,
      status: formValue.status as PotionOrder['status'],
      notes: formValue.notes || undefined,
      ingredients: formValue.ingredients.map((g) => ({
        id: g.id,
        name: g.name,
        quantity: g.quantity ?? 0,
        unit: g.unit,
        pricePerUnit: g.pricePerUnit ?? 0,
      })),
    };

    try {
      let result: PotionOrder;

      if (this.editMode() && this.order()) {
        this.orderService.updateOrder(this.order()!.id, orderData);
        result = { ...orderData, id: this.order()!.id, totalCost: this.totalCost() };
      } else {
        result = this.orderService.addOrder(orderData);
      }

      this.saved.emit(result);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.values(formGroup.controls).forEach((control) => {
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      } else {
        control.markAsTouched();
      }
    });

    this.ingredientInputs().forEach((input) => input.markAsTouched());
  }
}
