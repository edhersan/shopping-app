import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  TAX_RATE,
} from "./constants";
import { roundCurrency } from "./format";
import type { CartItem } from "../types";

export interface CartTotals {
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

export function calculateSubtotal(items: readonly CartItem[]): number {
  return roundCurrency(
    items.reduce(
      (accumulator, item) => accumulator + item.product.price * item.quantity,
      0,
    ),
  );
}

export function calculateTotals(items: readonly CartItem[]): CartTotals {
  const subtotal = calculateSubtotal(items);
  const tax = roundCurrency(subtotal * TAX_RATE);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = roundCurrency(subtotal + tax + shipping);

  return { subtotal, tax, shipping, total };
}
