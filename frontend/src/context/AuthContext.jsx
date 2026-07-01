import { createContext, useContext, useEffect, useState } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("sentisense_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("sentisense_user");
      }
    }
    setLoading(false);
  }, []);

  const persist = (token, userData) => {
    localStorage.setItem("sentisense_token", token);
    localStorage.setItem("sentisense_user", JSON.stringify(userData));
    setUser(userData);
  };

  const login = async (email, password) => {
    const { data } = await client.post("/auth/login", { email, password });
    persist(data.token, data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await client.post("/auth/register", {
      name,
      email,
      password,
    });
    persist(data.token, data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("sentisense_token");
    localStorage.removeItem("sentisense_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
