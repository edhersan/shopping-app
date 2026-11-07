import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import type { ReactNode } from "react";
import { calculateSubtotal } from "../utils/cart";
import { CART_STORAGE_KEY, MAX_QUANTITY_PER_ITEM } from "../utils/constants";
import type { CartItem, Product } from "../types";

interface CartState {
  items: CartItem[];
  hydrated: boolean;
}

type CartAction =
  | { type: "HYDRATE"; items: CartItem[] }
  | { type: "ADD_ITEM"; product: Product; quantity: number }
  | { type: "REMOVE_ITEM"; productId: string }
  | { type: "INCREMENT_ITEM"; productId: string }
  | { type: "DECREMENT_ITEM"; productId: string }
  | { type: "CLEAR" };

export interface CartContextValue {
  items: CartItem[];
  hydrated: boolean;
  itemCount: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  incrementItem: (productId: string) => void;
  decrementItem: (productId: string) => void;
  clearCart: () => void;
}

const INITIAL_STATE: CartState = { items: [], hydrated: false };

function clampQuantity(product: Product, quantity: number): number {
  return Math.max(1, Math.min(quantity, product.stock, MAX_QUANTITY_PER_ITEM));
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return { items: action.items, hydrated: true };

    case "ADD_ITEM": {
      if (action.product.stock <= 0) {
        return state;
      }

      const existing = state.items.find((item) => item.product.id === action.product.id);

      if (!existing) {
        return {
          ...state,
          items: [
            ...state.items,
            {
              product: action.product,
              quantity: clampQuantity(action.product, action.quantity),
            },
          ],
        };
      }

      const nextQuantity = clampQuantity(
        action.product,
        existing.quantity + action.quantity,
      );

      return {
        ...state,
        items: state.items.map((item) =>
          item.product.id === action.product.id
            ? { ...item, product: action.product, quantity: nextQuantity }
            : item,
        ),
      };
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => item.product.id !== action.productId),
      };

    case "INCREMENT_ITEM":
      return {
        ...state,
        items: state.items.map((item) => {
          if (item.product.id !== action.productId) {
            return item;
          }

          return {
            ...item,
            quantity: clampQuantity(item.product, item.quantity + 1),
          };
        }),
      };

    case "DECREMENT_ITEM":
      return {
        ...state,
        items: state.items.flatMap((item) => {
          if (item.product.id !== action.productId) {
            return [item];
          }

          if (item.quantity <= 1) {
            return [];
          }

          return [{ ...item, quantity: item.quantity - 1 }];
        }),
      };

    case "CLEAR":
      return { ...state, items: [] };

    default:
      return state;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isProduct(value: unknown): value is Product {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.description === "string" &&
    typeof value.price === "number" &&
    typeof value.currency === "string" &&
    typeof value.category === "string" &&
    typeof value.imageUrl === "string" &&
    typeof value.stock === "number" &&
    typeof value.rating === "number"
  );
}

function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const items: CartItem[] = [];

    for (const entry of parsed) {
      if (!isRecord(entry)) {
        continue;
      }

      const product = entry.product;
      const quantity = entry.quantity;

      if (
        !isProduct(product) ||
        typeof quantity !== "number" ||
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        continue;
      }

      const normalizedQuantity = Math.min(
        quantity,
        product.stock,
        MAX_QUANTITY_PER_ITEM,
      );

      if (normalizedQuantity >= 1) {
        items.push({ product, quantity: normalizedQuantity });
      }
    }

    return items;
  } catch {
    return [];
  }
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, INITIAL_STATE);

  useEffect(() => {
    let active = true;

    const hydrate = async (): Promise<void> => {
      try {
        const raw = await AsyncStorage.getItem(CART_STORAGE_KEY);

        if (active) {
          dispatch({ type: "HYDRATE", items: parseStoredCart(raw) });
        }
      } catch {
        if (active) {
          dispatch({ type: "HYDRATE", items: [] });
        }
      }
    };

    void hydrate();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!state.hydrated) {
      return;
    }

    const persist = async (): Promise<void> => {
      try {
        await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
      } catch {
        // Persistencia best-effort: el carrito sigue disponible en memoria.
      }
    };

    void persist();
  }, [state.items, state.hydrated]);

  const addItem = useCallback((product: Product, quantity = 1): void => {
    dispatch({ type: "ADD_ITEM", product, quantity });
  }, []);

  const removeItem = useCallback((productId: string): void => {
    dispatch({ type: "REMOVE_ITEM", productId });
  }, []);

  const incrementItem = useCallback((productId: string): void => {
    dispatch({ type: "INCREMENT_ITEM", productId });
  }, []);

  const decrementItem = useCallback((productId: string): void => {
    dispatch({ type: "DECREMENT_ITEM", productId });
  }, []);

  const clearCart = useCallback((): void => {
    dispatch({ type: "CLEAR" });
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = state.items.reduce(
      (accumulator, item) => accumulator + item.quantity,
      0,
    );

    return {
      items: state.items,
      hydrated: state.hydrated,
      itemCount,
      subtotal: calculateSubtotal(state.items),
      addItem,
      removeItem,
      incrementItem,
      decrementItem,
      clearCart,
    };
  }, [
    state.items,
    state.hydrated,
    addItem,
    removeItem,
    incrementItem,
    decrementItem,
    clearCart,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart debe utilizarse dentro de un CartProvider.");
  }

  return context;
}
