const DEFAULT_API_URL = "https://shopping-services-zeta.vercel.app/api";

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL
).replace(/\/+$/, "");

export const CART_STORAGE_KEY = "shopping.cart.v1";
export const AUTH_STORAGE_KEY = "shopping.auth.v1";
export const REQUEST_TIMEOUT_MS = 10000;

export const DEMO_ACCOUNT = {
  username: "expo",
  password: "1234",
} as const;

export const SAVED_CARD = {
  brand: "Visa",
  last4: "1111",
  cardNumber: "4111 1111 1111 1111",
  holderName: "Ana Torres",
  expiry: "12/30",
  cvv: "123",
} as const;

export const TAX_RATE = 0.08;
export const SHIPPING_FEE = 5.99;
export const FREE_SHIPPING_THRESHOLD = 100;

export const MAX_QUANTITY_PER_ITEM = 99;
