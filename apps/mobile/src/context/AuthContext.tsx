import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { ApiClientError, loginUser, registerUser } from "../services/api";
import {
  clearLegacySessionStorage,
  clearSessionStorage,
  readSessionRaw,
  writeSessionRaw,
} from "../services/sessionStorage";
import type { AuthSession, AuthUser, RegisterRequest, UserRole } from "../types";

export type AuthActionResult =
  | { success: true }
  | { success: false; message: string; details: string[] };

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  hydrated: boolean;
  login: (username: string, password: string) => Promise<AuthActionResult>;
  register: (payload: RegisterRequest) => Promise<AuthActionResult>;
  logout: () => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function failureResult(error: unknown): {
  success: false;
  message: string;
  details: string[];
} {
  if (error instanceof ApiClientError) {
    return {
      success: false,
      message: error.message,
      details: error.details ?? [],
    };
  }

  return {
    success: false,
    message:
      error instanceof Error ? error.message : "No se pudo completar la operación.",
    details: [],
  };
}

function parseUser(value: unknown): AuthUser | null {
  if (!isRecord(value) || typeof value.username !== "string") {
    return null;
  }

  const username = value.username;
  const role: UserRole = value.role === "admin" ? "admin" : "customer";

  return {
    id: typeof value.id === "string" ? value.id : `usr_local_${username}`,
    username,
    fullName: typeof value.fullName === "string" ? value.fullName : username,
    email: typeof value.email === "string" ? value.email : "",
    role,
    createdAt:
      typeof value.createdAt === "string"
        ? value.createdAt
        : new Date().toISOString(),
  };
}

function parseStoredSession(raw: string | null): AuthSession | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (
      !isRecord(parsed) ||
      typeof parsed.token !== "string" ||
      parsed.token.length === 0 ||
      typeof parsed.expiresAt !== "string"
    ) {
      return null;
    }

    const user = parseUser(parsed.user);

    if (!user) {
      return null;
    }

    const expiresAt = Date.parse(parsed.expiresAt);

    if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
      return null;
    }

    return { token: parsed.token, expiresAt: parsed.expiresAt, user };
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    const hydrate = async (): Promise<void> => {
      void clearLegacySessionStorage();

      try {
        const raw = await readSessionRaw();
        const parsed = parseStoredSession(raw);

        if (active) {
          setSession(parsed);

          if (raw !== null && parsed === null) {
            void clearSessionStorage();
          }
        }
      } catch {
        if (active) {
          setSession(null);
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

  const persist = useCallback(async (nextSession: AuthSession): Promise<void> => {
    try {
      await writeSessionRaw(JSON.stringify(nextSession));
    } catch {
      // La sesión sigue activa en memoria aunque no se pueda persistir.
    }
  }, []);

  const login = useCallback(
    async (username: string, password: string): Promise<AuthActionResult> => {
      try {
        const nextSession = await loginUser({
          username: username.trim().toLowerCase(),
          password,
        });

        setSession(nextSession);
        void persist(nextSession);

        return { success: true };
      } catch (error) {
        return failureResult(error);
      }
    },
    [persist],
  );

  const register = useCallback(
    async (payload: RegisterRequest): Promise<AuthActionResult> => {
      try {
        const nextSession = await registerUser(payload);

        setSession(nextSession);
        void persist(nextSession);

        return { success: true };
      } catch (error) {
        return failureResult(error);
      }
    },
    [persist],
  );

  const logout = useCallback((): void => {
    setSession(null);
    void clearSessionStorage();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      hydrated,
      login,
      register,
      logout,
    }),
    [session, hydrated, login, register, logout],
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
