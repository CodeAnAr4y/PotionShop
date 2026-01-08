import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';

import { IngredientInput } from './ingredient-input';
import { IngredientUnit } from '../../models/order.model';
import { AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';

beforeAll(() => {
  registerLocaleData(localeRu, 'ru');
});

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, IngredientInput],
  template: `
    <form [formGroup]="form">
      <div formArrayName="ingredients">
        <app-ingredient-input
          [formGroupName]="0"
          [index]="0"
          [canRemove]="true"
        ></app-ingredient-input>
      </div>
    </form>
  `,
})
class HostComponent {
  form = new FormGroup({
    ingredients: new FormArray<FormGroup>([
      new FormGroup({
        id: new FormControl<number>(1, { nonNullable: true }),
        name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
        quantity: new FormControl<number | null>(1, [Validators.required, Validators.min(0.1)]),
        unit: new FormControl<IngredientUnit>('г', {
          nonNullable: true,
          validators: [Validators.required],
        }),
        pricePerUnit: new FormControl<number | null>(0, [Validators.required, Validators.min(0)]),
      }),
    ]),
  });

  get ingredientGroup(): FormGroup {
    return (this.form.get('ingredients') as FormArray).at(0) as FormGroup;
  }
}

describe('IngredientInput (new logic)', () => {
  let host: HostComponent;
  let fixture: ComponentFixture<HostComponent>;
  let component: IngredientInput;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();

    const ingredientDE = fixture.debugElement.query(
      (de) => de.componentInstance instanceof IngredientInput
    );
    component = ingredientDE.componentInstance as IngredientInput;
  });

  describe('Component initialization', () => {
    it('must be created', () => {
      expect(component).toBeTruthy();
    });

    it('must have group with necessary controls', () => {
      expect(component.group.get('name')).toBeTruthy();
      expect(component.group.get('quantity')).toBeTruthy();
      expect(component.group.get('unit')).toBeTruthy();
      expect(component.group.get('pricePerUnit')).toBeTruthy();
    });
  });

  describe('Count cost', () => {
    it('must correctly count cost of ingredients', () => {
      host.ingredientGroup.patchValue({
        quantity: 5,
        pricePerUnit: 100,
      });
      fixture.detectChanges();

      expect(component.ingredientTotal()).toBe(500);
    });

    it('must return 0', () => {
      host.ingredientGroup.patchValue({
        quantity: 0,
        pricePerUnit: 0,
      });
      fixture.detectChanges();

      expect(component.ingredientTotal()).toBe(0);
    });
  });

  describe('Autocomplete', () => {
    it('must filter ingredients by request', () => {
      const mockEvent: AutoCompleteCompleteEvent = {
        originalEvent: new Event('input'),
        query: 'корень',
      };

      component.filterIngredients(mockEvent);

      expect(component.filteredIngredients().length).toBeGreaterThan(0);
      expect(component.filteredIngredients()[0].toLowerCase()).toContain('корень');
    });

    it('must substitute values when selecting an ingredient', () => {
      const mockEvent: AutoCompleteSelectEvent = {
        originalEvent: new Event('select'),
        value: 'Корень мандрагоры',
      };

      component.onIngredientSelect(mockEvent);
      fixture.detectChanges();

      expect(host.ingredientGroup.get('unit')!.value).toBe('г');
      expect(host.ingredientGroup.get('pricePerUnit')!.value).toBe(50);
    });

    it('must not change a form when non-existent ingredient selected', () => {
      const initialUnit = host.ingredientGroup.get('unit')!.value;
      const initialPrice = host.ingredientGroup.get('pricePerUnit')!.value;

      const mockEvent: AutoCompleteSelectEvent = {
        originalEvent: new Event('select'),
        value: 'some ingredient',
      };

      component.onIngredientSelect(mockEvent);
      fixture.detectChanges();

      expect(host.ingredientGroup.get('unit')!.value).toBe(initialUnit);
      expect(host.ingredientGroup.get('pricePerUnit')!.value).toBe(initialPrice);
    });
  });

  describe('Removing', () => {
    it('must set delete flag', () => {
      expect(component.removeRequested()).toBe(false);

      component.onRemove();

      expect(component.removeRequested()).toBe(true);
    });
  });

  describe('Touch state', () => {
    it('must mark all controls as touched', () => {
      component.markAsTouched();
      fixture.detectChanges();

      expect(host.ingredientGroup.get('name')!.touched).toBe(true);
      expect(host.ingredientGroup.get('quantity')!.touched).toBe(true);
      expect(host.ingredientGroup.get('unit')!.touched).toBe(true);
      expect(host.ingredientGroup.get('pricePerUnit')!.touched).toBe(true);
    });
  });

  describe('showErrors', () => {
    it('must return false if group is valid', () => {
      host.ingredientGroup.patchValue({
        name: 'Test',
        quantity: 10,
        unit: 'г',
        pricePerUnit: 100,
      });
      host.ingredientGroup.markAsTouched();
      fixture.detectChanges();

      expect(component.showErrors()).toBe(false);
    });

    it('must return false if not touched', () => {
      host.ingredientGroup.patchValue({ name: '' });
      fixture.detectChanges();

      expect(component.showErrors()).toBe(false);
    });

    it('must return true if group is not valid and already touched', () => {
      host.ingredientGroup.patchValue({ name: '' });
      component.markAsTouched();
      fixture.detectChanges();

      expect(component.showErrors()).toBe(true);
    });
  });

  it('must throw if used without formGroupName context', () => {
    const standaloneFixture = TestBed.createComponent(IngredientInput);
    const standaloneComponent = standaloneFixture.componentInstance;

    expect(() => standaloneComponent.group).toThrowError(
      'IngredientInput must be used with [formGroupName] inside a FormArray(FormGroup).'
    );
  });
});
