import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNG
import { DialogModule } from 'primeng/dialog';

import { PotionOrder } from '../../models/order.model';
import { OrderForm } from '../order-form/order-form';

@Component({
  selector: 'app-order-form-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DialogModule,
    OrderForm
  ],
  templateUrl: './order-form-dialog.html',
  styleUrl: './order-form-dialog.css'
})
export class OrderFormDialog {
  visible = input<boolean>(false);
  order = input<PotionOrder | null>(null);

  visibleChange = output<boolean>();
  saved = output<PotionOrder>();

  onVisibleChange(value: boolean): void {
    this.visibleChange.emit(value);
  }

  onSaved(order: PotionOrder): void {
    this.saved.emit(order);
    this.visibleChange.emit(false);
  }

  onCancelled(): void {
    this.visibleChange.emit(false);
  }
}