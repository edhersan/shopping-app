import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");

  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const separatorIndex = stored.indexOf(":");

  if (separatorIndex <= 0) {
    return false;
  }

  const salt = stored.slice(0, separatorIndex);
  const expectedHash = stored.slice(separatorIndex + 1);

  if (salt.length === 0 || expectedHash.length === 0) {
    return false;
  }

  const expected = Buffer.from(expectedHash, "hex");

  if (expected.length !== KEY_LENGTH) {
    return false;
  }

  const candidate = scryptSync(password, salt, KEY_LENGTH);

  return timingSafeEqual(candidate, expected);
}
