import { createContext, useContext, useState, type ReactNode } from "react";
import { authClient } from "../lib/clients";
import {
  clearToken,
  getItem,
  getToken,
  removeItem,
  setItem,
  setToken,
  SELECTED_TEAM_KEY,
} from "../lib/transport";
import { IdentityType } from "../gen/role_base/v1/role_pb";

const USERNAME_KEY = "user_admin_username";
const USER_ID_KEY = "user_admin_user_id";

interface AuthState {
  token: string | null;
  username: string | null;
  userId: bigint | null;
  login: (username: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthCtx = createContext<AuthState | null>(null);

function readStoredUserId(): bigint | null {
  const raw = getItem(USER_ID_KEY);
  if (!raw) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken());
  const [username, setUsername] = useState<string | null>(
    getItem(USERNAME_KEY),
  );
  const [userId, setUserId] = useState<bigint | null>(readStoredUserId());

  const login = async (u: string, password: string, remember: boolean) => {
    const res = await authClient.login({
      auth: { case: "username", value: u },
      password,
      agent: "web",
      agentVersion: "1",
      indentityType: IdentityType.GENERAL_USER,
    });
    setToken(res.token, remember);
    setTokenState(res.token);
    const name = res.user?.username || u;
    setItem(USERNAME_KEY, name, remember);
    setUsername(name);
    const id = res.user?.id ?? null;
    if (id !== null) {
      setItem(USER_ID_KEY, id.toString(), remember);
    } else {
      removeItem(USER_ID_KEY);
    }
    setUserId(id);
  };

  const logout = async () => {
    try {
      await authClient.logout({});
    } catch {
      // best-effort; clear local state regardless
    }
    clearToken();
    removeItem(USERNAME_KEY);
    removeItem(USER_ID_KEY);
    removeItem(SELECTED_TEAM_KEY);
    setTokenState(null);
    setUsername(null);
    setUserId(null);
  };

  return (
    <AuthCtx.Provider value={{ token, username, userId, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
