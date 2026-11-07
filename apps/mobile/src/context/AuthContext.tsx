import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { isValidDemoCredentials } from "../utils/auth";
import { AUTH_STORAGE_KEY } from "../utils/constants";
import type { AuthUser } from "../types";

export type LoginResult =
  | { success: true }
  | { success: false; message: string };

interface AuthContextValue {
  user: AuthUser | null;
  hydrated: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseStoredUser(raw: string | null): AuthUser | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!isRecord(parsed) || typeof parsed.username !== "string") {
      return null;
    }

    return { username: parsed.username };
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    const hydrate = async (): Promise<void> => {
      try {
        const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);

        if (active) {
          setUser(parseStoredUser(raw));
        }
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setHydrated(true);
        }
      }
    };

    void hydrate();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(
    async (username: string, password: string): Promise<LoginResult> => {
      if (!isValidDemoCredentials(username, password)) {
        return { success: false, message: "Usuario o contraseña incorrectos." };
      }

      const nextUser: AuthUser = { username: username.trim().toLowerCase() };
      setUser(nextUser);

      try {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
      } catch {
        // La sesión sigue activa en memoria aunque no se pueda persistir.
      }

      return { success: true };
    },
    [],
  );

  const logout = useCallback((): void => {
    setUser(null);
    void AsyncStorage.removeItem(AUTH_STORAGE_KEY).catch(() => undefined);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, hydrated, login, logout }),
    [user, hydrated, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider.");
  }

  return context;
}
