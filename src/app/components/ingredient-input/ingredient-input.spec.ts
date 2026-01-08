import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { IngredientInput } from './ingredient-input';
import { Ingredient } from '../../models/order.model';
import { AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';

beforeAll(() => {
  registerLocaleData(localeRu, 'ru');
});

describe('IngredientInput', () => {
  let component: IngredientInput;
  let fixture: ComponentFixture<IngredientInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IngredientInput, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(IngredientInput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component initialization', () => {
    it('must be created', () => {
      expect(component).toBeTruthy();
    });

    it('must have a form with necessary controls', () => {
      expect(component.form.controls.name).toBeDefined();
      expect(component.form.controls.quantity).toBeDefined();
      expect(component.form.controls.unit).toBeDefined();
      expect(component.form.controls.pricePerUnit).toBeDefined();
    });
  });

  describe('ControlValueAccessor', () => {
    it('must write value through writeValue', () => {
      const testIngredient: Ingredient = {
        id: 1,
        name: 'Корень мандрагоры',
        quantity: 50,
        unit: 'г',
        pricePerUnit: 100,
      };

      component.writeValue(testIngredient);

      expect(component.form.controls.name.value).toBe('Корень мандрагоры');
      expect(component.form.controls.quantity.value).toBe(50);
      expect(component.form.controls.unit.value).toBe('г');
      expect(component.form.controls.pricePerUnit.value).toBe(100);
    });

    it('must handle null in writeValue', () => {
      component.writeValue(null);
      expect(component.form.controls.name.value).toBe('');
    });

    it('must evoke onChange', () => {
      let called = false;
      component.registerOnChange(() => {
        called = true;
      });

      component.form.controls.name.setValue('Тест');

      expect(called).toBe(true);
    });

    it('must disable form through setDisabledState', () => {
      component.setDisabledState(true);
      expect(component.form.disabled).toBe(true);

      component.setDisabledState(false);
      expect(component.form.enabled).toBe(true);
    });
  });

  describe('Validation', () => {
    it('must be invalid when empty name', () => {
      component.form.controls.name.setValue('');
      component.form.controls.name.markAsTouched();

      const errors = component.validate(new FormControl());

      expect(errors).not.toBeNull();
      expect(errors!['name']).toBeDefined();
    });

    it('must be invalid when quantity less then 0.1', () => {
      component.form.controls.quantity.setValue(0);
      component.form.controls.quantity.markAsTouched();

      const errors = component.validate(new FormControl());

      expect(errors).not.toBeNull();
      expect(errors!['quantity']).toBeDefined();
    });

    it('must be valid', () => {
      component.form.patchValue({
        name: 'test',
        quantity: 10,
        unit: 'г',
        pricePerUnit: 100,
      });

      const errors = component.validate(new FormControl());

      expect(errors).toBeNull();
    });
  });

  describe('Count cost', () => {
    it('must correctly count cost of ingredients', () => {
      component.form.patchValue({
        quantity: 5,
        pricePerUnit: 100,
      });

      expect(component.ingredientTotal()).toBe(500);
    });

    it('must return 0', () => {
      component.form.patchValue({
        quantity: 0,
        pricePerUnit: 0,
      });

      expect(component.ingredientTotal()).toBe(0);
    });
  });

  describe('Autocomplete', () => {
    it('must sort ingredients by request', () => {
      const mockEvent: AutoCompleteCompleteEvent = {
        originalEvent: new Event('input'),
        query: 'корень',
      };

      component.filterIngredients(mockEvent);

      expect(component.filteredIngredients().length).toBeGreaterThan(0);
      expect(component.filteredIngredients()[0].toLowerCase()).toContain('корень');
    });

    it('must substitute values when selecting an ingredient', () => {
      // Создаём мок события с правильным типом
      const mockEvent: AutoCompleteSelectEvent = {
        originalEvent: new Event('select'),
        value: 'Корень мандрагоры',
      };

      component.onIngredientSelect(mockEvent);

      expect(component.form.controls.unit.value).toBe('г');
      expect(component.form.controls.pricePerUnit.value).toBe(50);
    });

    it('must not to change a form when non-existent ingredient selected', () => {
      const initialUnit = component.form.controls.unit.value;
      const initialPrice = component.form.controls.pricePerUnit.value;

      const mockEvent: AutoCompleteSelectEvent = {
        originalEvent: new Event('select'),
        value: 'some ingredient',
      };

      component.onIngredientSelect(mockEvent);

      expect(component.form.controls.unit.value).toBe(initialUnit);
      expect(component.form.controls.pricePerUnit.value).toBe(initialPrice);
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
    it('must mark form as touched', () => {
      let touchedCalled = false;
      component.registerOnTouched(() => {
        touchedCalled = true;
      });

      component.markAsTouched();

      expect(touchedCalled).toBe(true);
    });

    it('must mark all controls as touched', () => {
      component.markAsTouched();

      expect(component.form.controls.name.touched).toBe(true);
      expect(component.form.controls.quantity.touched).toBe(true);
      expect(component.form.controls.unit.touched).toBe(true);
      expect(component.form.controls.pricePerUnit.touched).toBe(true);
    });

    it('must not revoke onTouch again', () => {
      let callCount = 0;
      component.registerOnTouched(() => {
        callCount++;
      });

      component.markAsTouched();
      component.markAsTouched();
      component.markAsTouched();

      expect(callCount).toBe(1);
    });
  });

  describe('showErrors', () => {
    it('must return false if form is valid', () => {
      component.form.patchValue({
        name: 'Test',
        quantity: 10,
        unit: 'г',
        pricePerUnit: 100,
      });

      expect(component.showErrors()).toBe(false);
    });

    it('must return false ifif=s not touched', () => {
      component.form.controls.name.setValue('');

      expect(component.showErrors()).toBe(false);
    });

    it('must return true if form is not valid and already touched', () => {
      component.form.controls.name.setValue('');
      component.markAsTouched();

      expect(component.showErrors()).toBe(true);
    });
  });
});
