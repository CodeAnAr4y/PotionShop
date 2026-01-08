import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';

import { PotionOrder, OrderStatus } from '../../models/order.model';

@Component({
  selector: 'app-order-view-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    TagModule,
    DividerModule,
    TableModule
  ],
  templateUrl: './order-view-dialog.html',
  styleUrl: './order-view-dialog.css'
})
export class OrderViewDialog {
  visible = input<boolean>(false);
  order = input<PotionOrder | null>(null);

  visibleChange = output<boolean>();
  edit = output<PotionOrder>();

  getStatusSeverity(status: OrderStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severityMap: Record<OrderStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      'Новый': 'info',
      'В работе': 'warn',
      'Готов': 'success',
      'Доставлен': 'secondary',
      'Отменён': 'danger'
    };
    return severityMap[status] || 'info';
  }
}