import { API_BASE_URL, REQUEST_TIMEOUT_MS } from "../utils/constants";
import type {
  ApiResponse,
  AuthSession,
  AuthUser,
  CreateOrderRequest,
  LoginRequest,
  Order,
  OrderLineInput,
  PricingSummary,
  Product,
  RegisterRequest,
} from "../types";

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
    readonly details?: string[],
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  if (record.success === true) {
    return "data" in record;
  }

  if (record.success !== false) {
    return false;
  }

  const error = record.error;

  if (typeof error !== "object" || error === null) {
    return false;
  }

  const errorRecord = error as Record<string, unknown>;
  const details = errorRecord.details;

  return (
    typeof errorRecord.code === "string" &&
    typeof errorRecord.message === "string" &&
    (details === undefined ||
      (Array.isArray(details) && details.every((detail) => typeof detail === "string")))
  );
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const handleExternalAbort = (): void => controller.abort();
  options.signal?.addEventListener("abort", handleExternalAbort);

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });

    const text = await response.text();
    let raw: unknown;

    try {
      raw = JSON.parse(text) as unknown;
    } catch {
      throw new ApiClientError(
        "El servidor devolvió una respuesta que no es JSON.",
        "INVALID_RESPONSE",
        response.status,
      );
    }

    if (!isApiResponse<T>(raw)) {
      throw new ApiClientError(
        "La respuesta del servidor no tiene el formato esperado.",
        "INVALID_RESPONSE",
        response.status,
      );
    }

    if (!raw.success) {
      throw new ApiClientError(
        raw.error.message,
        raw.error.code,
        response.status,
        raw.error.details,
      );
    }

    return raw.data;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiClientError(
        "La solicitud superó el tiempo de espera. Intenta nuevamente.",
        "TIMEOUT",
        0,
      );
    }

    throw new ApiClientError(
      "No se pudo conectar con los microservicios. Verifica que el servidor esté activo.",
      "NETWORK_ERROR",
      0,
    );
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener("abort", handleExternalAbort);
  }
}

export function fetchProducts(signal?: AbortSignal): Promise<Product[]> {
  return request<Product[]>("/products", { signal });
}

export function fetchProduct(id: string, signal?: AbortSignal): Promise<Product> {
  return request<Product>(`/products/${encodeURIComponent(id)}`, { signal });
}

export function validateCart(
  items: OrderLineInput[],
  signal?: AbortSignal,
): Promise<PricingSummary> {
  return request<PricingSummary>("/cart/validate", {
    method: "POST",
    body: { items },
    signal,
  });
}

export function createOrder(payload: CreateOrderRequest): Promise<Order> {
  return request<Order>("/orders", {
    method: "POST",
    body: payload,
  });
}

export function loginUser(payload: LoginRequest): Promise<AuthSession> {
  return request<AuthSession>("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function registerUser(payload: RegisterRequest): Promise<AuthSession> {
  return request<AuthSession>("/auth/register", {
    method: "POST",
    body: payload,
  });
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export function fetchAdminUsers(token: string): Promise<AuthUser[]> {
  return request<AuthUser[]>("/admin/users", {
    headers: authHeaders(token),
  });
}

export function fetchAdminOrders(token: string): Promise<Order[]> {
  return request<Order[]>("/admin/orders", {
    headers: authHeaders(token),
  });
}

export function deleteAdminUser(token: string, userId: string): Promise<AuthUser> {
  return request<AuthUser>(`/admin/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export function updateProductStock(
  token: string,
  productId: string,
  stock: number,
): Promise<Product> {
  return request<Product>(
    `/admin/products/${encodeURIComponent(productId)}/stock`,
    {
      method: "POST",
      body: { stock },
      headers: authHeaders(token),
    },
  );
}
