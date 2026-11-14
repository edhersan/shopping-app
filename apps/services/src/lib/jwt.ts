import { createHmac, timingSafeEqual } from "node:crypto";
import { ApiError } from "./errors";
import type { User, UserRole } from "../types";

const DEFAULT_EXPIRES_IN_SECONDS = 8 * 60 * 60;
const MIN_SECRET_LENGTH = 32;
const JWT_ALGORITHM = "HS256";

export interface AuthTokenPayload {
  sub: string;
  username: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface IssuedAuthToken {
  token: string;
  expiresAt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUserRole(value: unknown): value is UserRole {
  return value === "admin" || value === "customer";
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new ApiError(
      500,
      "JWT_SECRET_INVALID",
      "JWT_SECRET debe estar configurado y tener al menos 32 caracteres.",
    );
  }

  return secret;
}

function getExpiresInSeconds(): number {
  const raw = process.env.JWT_EXPIRES_IN;

  if (raw === undefined || raw.trim().length === 0) {
    return DEFAULT_EXPIRES_IN_SECONDS;
  }

  const parsed = Number.parseInt(raw, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(
      500,
      "JWT_EXPIRES_IN_INVALID",
      "JWT_EXPIRES_IN debe ser un entero positivo expresado en segundos.",
    );
  }

  return parsed;
}

export function assertJwtConfiguration(): void {
  getJwtSecret();
  getExpiresInSeconds();
}

function encodeSegment(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeSegment(value: string): string | null {
  try {
    return Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

function signData(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

function parseHeader(segment: string): void {
  const json = decodeSegment(segment);

  if (json === null) {
    throw new ApiError(401, "INVALID_TOKEN", "El token es inválido.");
  }

  let header: unknown;

  try {
    header = JSON.parse(json);
  } catch {
    throw new ApiError(401, "INVALID_TOKEN", "El token es inválido.");
  }

  if (!isRecord(header) || header.alg !== JWT_ALGORITHM) {
    throw new ApiError(401, "INVALID_TOKEN", "El token usa un algoritmo no admitido.");
  }
}

function parsePayload(segment: string): AuthTokenPayload {
  const json = decodeSegment(segment);

  if (json === null) {
    throw new ApiError(401, "INVALID_TOKEN", "El token es inválido.");
  }

  let payload: unknown;

  try {
    payload = JSON.parse(json);
  } catch {
    throw new ApiError(401, "INVALID_TOKEN", "El token es inválido.");
  }

  if (!isRecord(payload)) {
    throw new ApiError(401, "INVALID_TOKEN", "El token es inválido.");
  }

  const { sub, username, role, iat, exp } = payload;

  if (
    typeof sub !== "string" ||
    sub.length === 0 ||
    typeof username !== "string" ||
    username.length === 0 ||
    !isUserRole(role) ||
    typeof iat !== "number" ||
    !Number.isInteger(iat) ||
    typeof exp !== "number" ||
    !Number.isInteger(exp)
  ) {
    throw new ApiError(401, "INVALID_TOKEN", "El token no contiene permisos válidos.");
  }

  return { sub, username, role, iat, exp };
}

export function signAuthToken(user: User): IssuedAuthToken {
  const secret = getJwtSecret();
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresIn = getExpiresInSeconds();
  const payload: AuthTokenPayload = {
    sub: user.id,
    username: user.username,
    role: user.role,
    iat: issuedAt,
    exp: issuedAt + expiresIn,
  };

  const headerSegment = encodeSegment(
    JSON.stringify({ alg: JWT_ALGORITHM, typ: "JWT" }),
  );
  const payloadSegment = encodeSegment(JSON.stringify(payload));
  const data = `${headerSegment}.${payloadSegment}`;
  const signature = signData(data, secret);

  return {
    token: `${data}.${signature}`,
    expiresAt: new Date(payload.exp * 1000).toISOString(),
  };
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const secret = getJwtSecret();
  const segments = token.split(".");

  if (segments.length !== 3) {
    throw new ApiError(401, "INVALID_TOKEN", "El token es inválido.");
  }

  const headerSegment = segments[0];
  const payloadSegment = segments[1];
  const signature = segments[2];

  if (
    headerSegment === undefined ||
    payloadSegment === undefined ||
    signature === undefined ||
    headerSegment.length === 0 ||
    payloadSegment.length === 0 ||
    signature.length === 0
  ) {
    throw new ApiError(401, "INVALID_TOKEN", "El token es inválido.");
  }

  parseHeader(headerSegment);

  const data = `${headerSegment}.${payloadSegment}`;
  const expectedSignature = signData(data, secret);
  const providedBuffer = Buffer.from(signature, "base64url");
  const expectedBuffer = Buffer.from(expectedSignature, "base64url");

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new ApiError(401, "INVALID_TOKEN", "La firma del token no es válida.");
  }

  const payload = parsePayload(payloadSegment);
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp <= now) {
    throw new ApiError(
      401,
      "TOKEN_EXPIRED",
      "La sesión expiró. Inicia sesión nuevamente.",
    );
  }

  if (payload.iat > now + 60) {
    throw new ApiError(401, "INVALID_TOKEN", "El token no es válido todavía.");
  }

  return payload;
}
