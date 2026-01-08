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
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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

// PrimeNG
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
} from '../../models/order.model';
import { OrderService } from '../../services/order';
import { IngredientInput } from '../ingredient-input/ingredient-input';

// Validators
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

@Component({
  selector: 'app-order-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  // params
  order = input<PotionOrder | null>(null);
  saved = output<PotionOrder>();
  cancelled = output<void>();

  ingredientInputs = viewChildren(IngredientInput);

  // states
  editMode = signal(false);
  isSubmitting = signal(false);

  // static data
  readonly deliveryMethods: DeliveryMethod[] = DELIVERY_METHODS;
  readonly paymentMethods: PaymentMethod[] = PAYMENT_METHODS;
  readonly statusOptions = ['Новый', 'В работе', 'Готов', 'Доставлен', 'Отменён'];

  // form
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
      ingredients: new FormArray<FormControl<Ingredient>>([], [minIngredients(3)]),
    },
    { validators: dueDateAfterOrderDate }
  );

  // ingredients change detector
  private ingredientsVersion = signal(0);

  // Computed total cost
  totalCost = computed(() => {
    this.ingredientsVersion();
    return this.ingredientsArray.controls.reduce((sum, control) => {
      const ing = control.value;
      return sum + (ing?.quantity || 0) * (ing?.pricePerUnit || 0);
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

  private subscriptions: Subscription[] = [];

  constructor(private orderService: OrderService, private cdr: ChangeDetectorRef) {
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

  get ingredientsArray(): FormArray<FormControl<Ingredient>> {
    return this.form.controls.ingredients;
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.ingredientsArray.valueChanges.subscribe(() => {
        this.ingredientsVersion.update((v) => v + 1);
        this.cdr.markForCheck();
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

    this.cdr.markForCheck();
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
      this.ingredientsArray.push(new FormControl<Ingredient>(ing, { nonNullable: true }));
    });

    this.cdr.markForCheck();
  }

  addIngredient(): void {
    const newIngredient: Ingredient = {
      id: Date.now() + Math.random(),
      name: '',
      quantity: 1,
      unit: 'г',
      pricePerUnit: 0,
    };

    this.ingredientsArray.push(new FormControl<Ingredient>(newIngredient, { nonNullable: true }));

    this.ingredientsVersion.update((v) => v + 1);
    this.cdr.markForCheck();
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
      this.cdr.markForCheck();
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      this.cdr.markForCheck();
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
      ingredients: formValue.ingredients,
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
      this.cdr.markForCheck();
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
