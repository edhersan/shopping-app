import { DEMO_ACCOUNT } from "./constants";

export function isValidDemoCredentials(username: string, password: string): boolean {
  const normalizedUsername = username.trim().toLowerCase();

  return (
    normalizedUsername === DEMO_ACCOUNT.username && password === DEMO_ACCOUNT.password
  );
}
