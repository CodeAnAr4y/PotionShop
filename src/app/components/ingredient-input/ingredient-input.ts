import { Component, input, signal, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlContainer, FormGroup, ReactiveFormsModule } from '@angular/forms';

import {
  AutoCompleteModule,
  AutoCompleteCompleteEvent,
  AutoCompleteSelectEvent,
} from 'primeng/autocomplete';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

import { AVAILABLE_INGREDIENTS, INGREDIENT_UNITS, IngredientUnit } from '../../models/order.model';

@Component({
  selector: 'app-ingredient-input',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AutoCompleteModule,
    InputNumberModule,
    SelectModule,
    ButtonModule,
    TooltipModule,
  ],
  templateUrl: './ingredient-input.html',
  styleUrl: './ingredient-input.css',
})
export class IngredientInput {
  index = input<number>(0);
  canRemove = input<boolean>(true);

  readonly availableIngredients = input<{ name: string; defaultPrice: number; unit: IngredientUnit }[]>([]);
  readonly units = INGREDIENT_UNITS;

  filteredIngredients = signal<string[]>([]);
  removeRequested = signal(false);

  constructor(@Optional() private controlContainer: ControlContainer | null) {}

  get group(): FormGroup {
    const ctrl = this.controlContainer?.control;
    if (!(ctrl instanceof FormGroup)) {
      throw new Error('IngredientInput must be used with [formGroupName] inside a FormArray(FormGroup).');
    }
    return ctrl;
  }

  filterIngredients(event: AutoCompleteCompleteEvent): void {
    const query = event.query.toLowerCase();
    this.filteredIngredients.set(
      this.availableIngredients()
        .map((i) => i.name)
        .filter((name) => name.toLowerCase().includes(query))
    );
  }

  onIngredientSelect(event: AutoCompleteSelectEvent): void {
    const value = event.value as string;
    const selected = this.availableIngredients().find((i) => i.name === value);
    if (!selected) return;

    this.group.patchValue({
      unit: selected.unit,
      pricePerUnit: selected.defaultPrice,
    });
  }

  onRemove(): void {
    this.removeRequested.set(true);
  }

  markAsTouched(): void {
    this.group.markAsTouched();
    Object.values(this.group.controls).forEach((c) => c.markAsTouched());
  }

  showErrors(): boolean {
    return this.group.invalid && this.group.touched;
  }

  ingredientTotal(): number {
    const qty = this.group.get('quantity')?.value ?? 0;
    const price = this.group.get('pricePerUnit')?.value ?? 0;
    return qty * price;
  }
}