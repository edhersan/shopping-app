import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import healthHandler from "../../api/health";
import docsHandler from "../../api/docs";
import openApiHandler from "../../api/openapi";
import productByIdHandler from "../../api/products/[id]";
import productsHandler from "../../api/products/index";
import validateCartHandler from "../../api/cart/validate";
import orderByIdHandler from "../../api/orders/[id]";
import ordersHandler from "../../api/orders/index";
import loginHandler from "../../api/auth/login";
import registerHandler from "../../api/auth/register";
import adminOrdersHandler from "../../api/admin/orders/index";
import adminStockHandler from "../../api/admin/products/[id]/stock";
import adminUserHandler from "../../api/admin/users/[id]";
import adminUsersHandler from "../../api/admin/users/index";
import { ApiError } from "../lib/errors";
import { handleOptions, sendError } from "../lib/http";
import { assertJwtConfiguration } from "../lib/jwt";

type Handler = (req: VercelRequest, res: VercelResponse) => void | Promise<void>;

interface RouteDefinition {
  method: "GET" | "POST" | "DELETE";
  pattern: RegExp;
  handler: Handler;
  paramName?: string;
}

interface LocalVercelResponse {
  status(code: number): LocalVercelResponse;
  setHeader(
    name: string,
    value: number | string | readonly string[],
  ): LocalVercelResponse;
  json(payload: unknown): LocalVercelResponse;
  end(chunk?: string): LocalVercelResponse;
}

const LANDING_HTML = readFileSync(
  join(process.cwd(), "public", "index.html"),
  "utf8",
);

function loadLocalEnv(): void {
  const envPath = join(process.cwd(), ".env");

  if (typeof process.loadEnvFile === "function") {
    try {
      process.loadEnvFile(envPath);
      return;
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: unknown }).code)
          : "";

      if (code === "ENOENT") {
        return;
      }

      console.warn(`No se pudo cargar ${envPath}:`, error);
      return;
    }
  }

  try {
    const content = readFileSync(envPath, "utf8");

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (trimmed.length === 0 || trimmed.startsWith("#")) {
        continue;
      }

      const separator = trimmed.indexOf("=");

      if (separator <= 0) {
        continue;
      }

      const key = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";

    if (code !== "ENOENT") {
      console.warn(`No se pudo cargar ${envPath}:`, error);
    }
  }
}

const landingHandler: Handler = (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).end(LANDING_HTML);
};

const routes: readonly RouteDefinition[] = [
  { method: "GET", pattern: /^\/$/, handler: landingHandler },
  { method: "GET", pattern: /^\/api\/health\/?$/, handler: healthHandler },
  { method: "GET", pattern: /^\/api\/docs\/?$/, handler: docsHandler },
  { method: "GET", pattern: /^\/api\/openapi\/?$/, handler: openApiHandler },
  { method: "GET", pattern: /^\/api\/products\/?$/, handler: productsHandler },
  {
    method: "GET",
    pattern: /^\/api\/products\/([^/]+)\/?$/,
    handler: productByIdHandler,
    paramName: "id",
  },
  {
    method: "POST",
    pattern: /^\/api\/cart\/validate\/?$/,
    handler: validateCartHandler,
  },
  { method: "POST", pattern: /^\/api\/orders\/?$/, handler: ordersHandler },
  {
    method: "GET",
    pattern: /^\/api\/orders\/([^/]+)\/?$/,
    handler: orderByIdHandler,
    paramName: "id",
  },
  { method: "POST", pattern: /^\/api\/auth\/register\/?$/, handler: registerHandler },
  { method: "POST", pattern: /^\/api\/auth\/login\/?$/, handler: loginHandler },
  {
    method: "GET",
    pattern: /^\/api\/admin\/users\/?$/,
    handler: adminUsersHandler,
  },
  {
    method: "DELETE",
    pattern: /^\/api\/admin\/users\/([^/]+)\/?$/,
    handler: adminUserHandler,
    paramName: "id",
  },
  {
    method: "GET",
    pattern: /^\/api\/admin\/orders\/?$/,
    handler: adminOrdersHandler,
  },
  {
    method: "POST",
    pattern: /^\/api\/admin\/products\/([^/]+)\/stock\/?$/,
    handler: adminStockHandler,
    paramName: "id",
  },
];

function createRequest(
  req: IncomingMessage,
  url: URL,
  body: unknown,
): VercelRequest {
  const query: Record<string, string | string[]> = {};

  for (const key of url.searchParams.keys()) {
    const values = url.searchParams.getAll(key);
    query[key] = values.length > 1 ? values : values[0] ?? "";
  }

  return {
    method: req.method,
    url: req.url,
    headers: req.headers,
    query,
    body,
    cookies: {},
  } as unknown as VercelRequest;
}

function createResponse(res: ServerResponse): VercelResponse {
  let currentStatus = 200;
  const headers = new Map<string, string>();

  const writeHead = (): void => {
    res.writeHead(currentStatus, Object.fromEntries(headers));
  };

  const api: LocalVercelResponse = {
    status(code: number) {
      currentStatus = code;
      return api;
    },
    setHeader(name: string, value: number | string | readonly string[]) {
      headers.set(name.toLowerCase(), Array.isArray(value) ? value.join(", ") : String(value));
      return api;
    },
    json(payload: unknown) {
      headers.set("content-type", "application/json; charset=utf-8");
      writeHead();
      res.end(JSON.stringify(payload));
      return api;
    },
    end(chunk?: string) {
      writeHead();
      res.end(chunk);
      return api;
    },
  };

  return api as unknown as VercelResponse;
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    const value: unknown = chunk;

    if (typeof value === "string") {
      chunks.push(Buffer.from(value));
    } else if (value instanceof Buffer) {
      chunks.push(value);
    }
  }

  if (chunks.length === 0) {
    return undefined;
  }

  const raw = Buffer.concat(chunks).toString("utf8");

  if (raw.trim().length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const method = req.method ?? "GET";
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const response = createResponse(res);

  try {
    if (method === "OPTIONS") {
      handleOptions(response);
      return;
    }

    const pathMatches = routes.filter((route) => route.pattern.test(url.pathname));

    if (pathMatches.length === 0) {
      throw new ApiError(404, "NOT_FOUND", `No existe la ruta ${url.pathname}.`);
    }

    const route = pathMatches.find((candidate) => candidate.method === method);

    if (!route) {
      throw new ApiError(
        405,
        "METHOD_NOT_ALLOWED",
        `El método ${method} no está permitido para ${url.pathname}.`,
      );
    }

    const body = method === "POST" ? await readBody(req) : undefined;
    const request = createRequest(req, url, body);
    const match = route.pattern.exec(url.pathname);

    if (route.paramName !== undefined) {
      const paramValue = match?.[1];

      if (paramValue !== undefined) {
        request.query[route.paramName] = decodeURIComponent(paramValue);
      }
    }

    await route.handler(request, response);
  } catch (error) {
    sendError(response, error);
  }
}

loadLocalEnv();

try {
  assertJwtConfiguration();
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Configuración JWT inválida.",
  );
  process.exit(1);
}

const parsedPort = Number(process.env.PORT ?? "3000");
const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 3000;

const server = createServer((req, res) => {
  void handleRequest(req, res);
});

server.listen(port, () => {
  console.log(`API local disponible en http://localhost:${port}/api`);
  console.log("Landing: GET /");
  console.log("Rutas: GET /api/health, GET /api/docs, GET /api/openapi, GET /api/products, GET /api/products/:id");
  console.log("       POST /api/cart/validate, POST /api/orders, GET /api/orders/:id");
  console.log("       POST /api/auth/register, POST /api/auth/login");
  console.log("       GET /api/admin/users, DELETE /api/admin/users/:id, GET /api/admin/orders");
  console.log("       POST /api/admin/products/:id/stock");
});
