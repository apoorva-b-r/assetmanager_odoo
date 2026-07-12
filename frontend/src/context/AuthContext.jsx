import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiClient } from "../lib/api-client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    setLoading(true);
    try {
      const data = await apiClient.get("/auth/me");
      setUser(data.user ?? null);
      return data.user ?? null;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await apiClient.post("/auth/logout");
    setUser(null);
  }

  useEffect(() => {
    refreshUser();
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    setUser,
    refreshUser,
    logout,
    isAdmin: user?.role === "ADMIN",
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
