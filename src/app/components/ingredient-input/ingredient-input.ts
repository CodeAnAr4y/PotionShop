import {
  Component,
  forwardRef,
  input,
  signal,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  Validator,
  ValidationErrors,
  AbstractControl,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';

// PrimeNG
import {
  AutoCompleteModule,
  AutoCompleteCompleteEvent,
  AutoCompleteSelectEvent,
} from 'primeng/autocomplete';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

import {
  Ingredient,
  IngredientUnit,
  AVAILABLE_INGREDIENTS,
  INGREDIENT_UNITS,
} from '../../models/order.model';

@Component({
  selector: 'app-ingredient-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AutoCompleteModule,
    InputNumberModule,
    SelectModule,
    ButtonModule,
    TooltipModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IngredientInput),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => IngredientInput),
      multi: true,
    },
  ],
  templateUrl: './ingredient-input.html',
  styleUrl: './ingredient-input.css',
})
export class IngredientInput implements ControlValueAccessor, Validator, OnInit, OnDestroy {
  index = input<number>(0);
  canRemove = input<boolean>(true);

  form = new FormGroup({
    id: new FormControl<number>(0, { nonNullable: true }),
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    quantity: new FormControl<number | null>(1, [Validators.required, Validators.min(0.1)]),
    unit: new FormControl<IngredientUnit>('г', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    pricePerUnit: new FormControl<number | null>(0, [Validators.required, Validators.min(0)]),
  });

  // static data
  readonly availableIngredients = AVAILABLE_INGREDIENTS;
  readonly units = INGREDIENT_UNITS;

  // autocomplete state
  filteredIngredients = signal<string[]>([]);

  ingredientTotal = signal(0);

  private formSubscription?: Subscription;

  // ControlValueAccessor callbacks
  private onChange: (value: Ingredient) => void = () => {};
  private onTouched: () => void = () => {};
  private touched = signal(false);

  // delete event
  removeRequested = signal(false);

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.formSubscription = this.form.valueChanges.subscribe(() => {
      this.updateTotal();
      this.emitValue();
      this.cdr.markForCheck();
    });

    this.updateTotal();
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
  }

  writeValue(value: Ingredient | null): void {
    if (value) {
      this.form.patchValue(
        {
          id: value.id,
          name: value.name,
          quantity: value.quantity,
          unit: value.unit,
          pricePerUnit: value.pricePerUnit,
        },
        { emitEvent: false }
      );
    } else {
      this.form.reset(
        { id: 0, name: '', quantity: 1, unit: 'г', pricePerUnit: 0 },
        { emitEvent: false }
      );
    }

    this.updateTotal();
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: Ingredient) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) this.form.disable({ emitEvent: false });
    else this.form.enable({ emitEvent: false });

    this.cdr.markForCheck();
  }

  // Validator implementation
  validate(_control: AbstractControl): ValidationErrors | null {
    if (this.form.valid) return null;

    const errors: ValidationErrors = {};
    if (this.form.controls.name.errors) errors['name'] = this.form.controls.name.errors;
    if (this.form.controls.quantity.errors) errors['quantity'] = this.form.controls.quantity.errors;
    if (this.form.controls.unit.errors) errors['unit'] = this.form.controls.unit.errors;
    if (this.form.controls.pricePerUnit.errors)
      errors['pricePerUnit'] = this.form.controls.pricePerUnit.errors;

    return errors;
  }

  // filtering ingredients for autocomplete
  filterIngredients(event: AutoCompleteCompleteEvent): void {
    const query = event.query.toLowerCase();
    this.filteredIngredients.set(
      this.availableIngredients
        .map((i) => i.name)
        .filter((name) => name.toLowerCase().includes(query))
    );
  }

  // set default data for selected ingredients
  onIngredientSelect(event: AutoCompleteSelectEvent): void {
    const value = event.value as string;
    const selected = this.availableIngredients.find((i) => i.name === value);
    if (selected) {
      this.form.patchValue(
        {
          unit: selected.unit,
          pricePerUnit: selected.defaultPrice,
        },
        { emitEvent: true }
      );
    }
  }

  // remove ingredient
  onRemove(): void {
    this.removeRequested.set(true);
    this.cdr.markForCheck();
  }

  showErrors(): boolean {
    return this.form.invalid && this.touched();
  }

  markAsTouched(): void {
    if (!this.touched()) {
      this.touched.set(true);
      this.onTouched();
    }
    Object.keys(this.form.controls).forEach((key) => {
      this.form.get(key)?.markAsTouched();
    });
    this.cdr.markForCheck();
  }

  private updateTotal(): void {
    const qty = this.form.controls.quantity.value ?? 0;
    const price = this.form.controls.pricePerUnit.value ?? 0;
    this.ingredientTotal.set(qty * price);
  }

  private emitValue(): void {
    const value: Ingredient = {
      id: this.form.controls.id.value || Date.now(),
      name: this.form.controls.name.value || '',
      quantity: this.form.controls.quantity.value ?? 0,
      unit: this.form.controls.unit.value || 'г',
      pricePerUnit: this.form.controls.pricePerUnit.value ?? 0,
    };

    this.onChange(value);
  }
}
