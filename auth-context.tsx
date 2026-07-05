"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type AuthContextValue = {
  token: string | null;
  ready: boolean;
  setToken: (token: string | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "auth_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTokenState(window.localStorage.getItem(STORAGE_KEY));
    setReady(true);
  }, []);

  function setToken(value: string | null) {
    if (value) {
      window.localStorage.setItem(STORAGE_KEY, value);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setTokenState(value);
  }

  function logout() {
    setToken(null);
  }

  return <AuthContext.Provider value={{ token, ready, setToken, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.");
  }
  return ctx;
}
