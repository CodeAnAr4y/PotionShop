import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { PotionOrder } from './models/order.model';
import { OrdersTable } from './components/orders-table/orders-table';
import { OrderFormDialog } from './components/order-form-dialog/order-form-dialog';
import { OrderViewDialog } from './components/order-view-dialog/order-view-dialog';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ToastModule, OrdersTable, OrderFormDialog, OrderViewDialog],
  providers: [MessageService],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  formDialogVisible = signal(false);
  viewDialogVisible = signal(false);
  selectedOrder = signal<PotionOrder | null>(null);

  constructor(private messageService: MessageService) {}

  openCreateDialog(): void {
    this.selectedOrder.set(null);
    this.formDialogVisible.set(true);
  }

  openEditDialog(order: PotionOrder): void {
    this.selectedOrder.set(order);
    this.formDialogVisible.set(true);
  }

  openViewDialog(order: PotionOrder): void {
    this.selectedOrder.set(order);
    this.viewDialogVisible.set(true);
  }

  onEditFromView(order: PotionOrder): void {
    this.viewDialogVisible.set(false);
      this.openEditDialog(order);
  }

  onOrderSaved(order: PotionOrder): void {
    const isNew = !this.selectedOrder();
    this.messageService.add({
      severity: 'success',
      summary: isNew ? 'Заказ создан' : 'Заказ обновлён',
      detail: `Заказ ${order.potionNumber} успешно ${isNew ? 'создан' : 'обновлён'}`,
      life: 3000,
    });
  }

  onOrderDeleted(order: PotionOrder): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Заказ удалён',
      detail: `Заказ ${order.potionNumber} был удалён`,
      life: 3000,
    });
  }
}
