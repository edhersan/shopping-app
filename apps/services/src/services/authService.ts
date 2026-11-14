import { randomUUID } from "node:crypto";
import type { VercelRequest } from "@vercel/node";
import { ApiError } from "../lib/errors";
import { signAuthToken, verifyAuthToken } from "../lib/jwt";
import { hashPassword, verifyPassword } from "../lib/password";
import {
  deleteUserById,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  listUsers,
  saveUser,
} from "../store/users";
import type { StoredUser } from "../store/users";
import type { AuthSession, LoginRequest, RegisterRequest, User } from "../types";

function toPublicUser(user: StoredUser): User {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export function registerUser(request: RegisterRequest): User {
  const username = request.username.trim().toLowerCase();
  const email = request.email.trim().toLowerCase();

  if (findUserByUsername(username)) {
    throw new ApiError(
      409,
      "USERNAME_TAKEN",
      "El nombre de usuario ya está registrado.",
      ["Elige otro nombre de usuario."],
    );
  }

  if (findUserByEmail(email)) {
    throw new ApiError(
      409,
      "EMAIL_TAKEN",
      "El correo electrónico ya está registrado.",
      ["Usa otro correo o inicia sesión con tu cuenta."],
    );
  }

  const user: StoredUser = {
    id: `usr_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
    username,
    fullName: request.fullName.trim(),
    email,
    role: "customer",
    passwordHash: hashPassword(request.password),
    createdAt: new Date().toISOString(),
  };

  saveUser(user);

  return toPublicUser(user);
}

export function authenticate(request: LoginRequest): User {
  const username = request.username.trim().toLowerCase();
  const user = findUserByUsername(username);

  if (!user || !verifyPassword(request.password, user.passwordHash)) {
    throw new ApiError(
      401,
      "INVALID_CREDENTIALS",
      "Usuario o contraseña incorrectos.",
    );
  }

  return toPublicUser(user);
}

export function listPublicUsers(): User[] {
  return listUsers().map(toPublicUser);
}

export function deleteUser(userId: string): User {
  const user = findUserById(userId);

  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", `El usuario ${userId} no existe.`);
  }

  if (user.role === "admin") {
    throw new ApiError(
      409,
      "CANNOT_DELETE_ADMIN",
      "No se puede eliminar a un usuario administrador.",
    );
  }

  const deleted = deleteUserById(user.id);

  if (!deleted) {
    throw new ApiError(404, "USER_NOT_FOUND", `El usuario ${userId} no existe.`);
  }

  return toPublicUser(deleted);
}

export function createAuthSession(user: User): AuthSession {
  const { token, expiresAt } = signAuthToken(user);

  return { token, expiresAt, user };
}

function readBearerToken(req: VercelRequest): string {
  const header = req.headers.authorization;
  const value = Array.isArray(header) ? header[0] : header;

  if (!value || !value.startsWith("Bearer ")) {
    throw new ApiError(
      401,
      "MISSING_TOKEN",
      "Debes enviar un token de sesión en el encabezado Authorization.",
    );
  }

  const token = value.slice("Bearer ".length).trim();

  if (token.length === 0) {
    throw new ApiError(
      401,
      "MISSING_TOKEN",
      "Debes enviar un token de sesión en el encabezado Authorization.",
    );
  }

  return token;
}

export function requireAuth(req: VercelRequest): User {
  const claims = verifyAuthToken(readBearerToken(req));
  const user = findUserById(claims.sub) ?? findUserByUsername(claims.username);

  if (!user) {
    throw new ApiError(
      401,
      "INVALID_TOKEN",
      "El usuario de la sesión ya no existe. Inicia sesión nuevamente.",
    );
  }

  if (user.role !== claims.role) {
    throw new ApiError(
      401,
      "INVALID_TOKEN",
      "Los permisos del token ya no son válidos. Inicia sesión nuevamente.",
    );
  }

  return toPublicUser(user);
}

export function requireAdmin(req: VercelRequest): User {
  const user = requireAuth(req);

  if (user.role !== "admin") {
    throw new ApiError(
      403,
      "FORBIDDEN",
      "No tienes permisos para acceder a este recurso.",
    );
  }

  return user;
}
