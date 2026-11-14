import type { Order } from "../types";

const orders = new Map<string, Order>();

export function saveOrder(order: Order): Order {
  orders.set(order.id, order);
  return order;
}

export function findOrderById(id: string): Order | undefined {
  return orders.get(id);
}

export function listOrders(): Order[] {
  return Array.from(orders.values()).sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}
