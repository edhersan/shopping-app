import { randomUUID } from "node:crypto";
import { hashPassword } from "../lib/password";
import type { UserRole } from "../types";

export interface StoredUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  passwordHash: string;
  createdAt: string;
}

const users = new Map<string, StoredUser>();

function createUser(
  username: string,
  password: string,
  fullName: string,
  email: string,
  role: UserRole,
): StoredUser {
  return {
    id: `usr_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
    username,
    fullName,
    email: email.toLowerCase(),
    role,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
}

function seedUser(user: StoredUser): void {
  users.set(user.username, user);
}

seedUser(
  createUser("admin", "admin123", "Administrador", "admin@shopping.app", "admin"),
);
seedUser(createUser("expo", "1234", "Expo Demo", "expo@shopping.app", "customer"));

export function saveUser(user: StoredUser): StoredUser {
  users.set(user.username, user);
  return user;
}

export function findUserByUsername(username: string): StoredUser | undefined {
  return users.get(username);
}

export function findUserById(id: string): StoredUser | undefined {
  for (const user of users.values()) {
    if (user.id === id) {
      return user;
    }
  }

  return undefined;
}

export function findUserByEmail(email: string): StoredUser | undefined {
  const normalizedEmail = email.trim().toLowerCase();

  for (const user of users.values()) {
    if (user.email === normalizedEmail) {
      return user;
    }
  }

  return undefined;
}

export function listUsers(): StoredUser[] {
  return Array.from(users.values());
}

export function deleteUserById(id: string): StoredUser | undefined {
  const user = findUserById(id);

  if (!user) {
    return undefined;
  }

  users.delete(user.username);
  return user;
}
