import { Component, output, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { SelectModule } from 'primeng/select';

import { PotionOrder, OrderStatus } from '../../models/order.model';
import { OrderService } from '../../services/order';

@Component({
  selector: 'app-orders-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ConfirmDialogModule,
    SelectModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './orders-table.html',
  styleUrl: './orders-table.css',
})
export class OrdersTable {
  createOrder = output<void>();
  editOrder = output<PotionOrder>();
  viewOrder = output<PotionOrder>();
  deleteOrder = output<PotionOrder>();

  selectedStatusFilter: string | null = null;
  statusFilterOptions = ['Новый', 'В работе', 'Готов', 'Доставлен', 'Отменён'];

  orders = computed(() => this.orderService.getOrders());
  totalOrders = computed(() => this.orderService.totalOrders());
  totalRevenue = computed(() => this.orderService.totalRevenue());
  pendingOrders = computed(() => this.orderService.pendingOrders());

  completedOrders = computed(
    () => this.orders().filter((o) => o.status === 'Готов' || o.status === 'Доставлен').length
  );

  formattedRevenue = computed(() => {
    const revenue = this.totalRevenue();
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(revenue);
  });

  constructor(
    private orderService: OrderService,
    private confirmationService: ConfirmationService
  ) {}

  trackByOrderId(index: number, order: PotionOrder): number {
    return order.id;
  }

  getStatusSeverity(
    status: OrderStatus
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severityMap: Record<
      OrderStatus,
      'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'
    > = {
      Новый: 'info',
      'В работе': 'warn',
      Готов: 'success',
      Доставлен: 'secondary',
      Отменён: 'danger',
    };
    return severityMap[status] || 'info';
  }

  isOverdue(order: PotionOrder): boolean {
    if (order.status === 'Доставлен' || order.status === 'Отменён') {
      return false;
    }
    return new Date(order.dueDate) < new Date();
  }

  filterByStatus(status: string | null, table: any): void {
    if (status) {
      table.filter(status, 'status', 'equals');
    } else {
      table.filter('', 'status', 'contains');
    }
  }

  confirmDelete(order: PotionOrder): void {
    this.confirmationService.confirm({
      message: `Вы уверены, что хотите удалить заказ "${order.potionNumber}"?`,
      accept: () => {
        this.orderService.deleteOrder(order.id);
        this.deleteOrder.emit(order);
      },
    });
  }
}
