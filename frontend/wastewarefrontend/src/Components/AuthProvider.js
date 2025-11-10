import React, { createContext, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  // initialize from sessionStorage so token persists across navigations/reloads
  const [accessToken, setAccessToken] = useState(() => {
    try {
      return sessionStorage.getItem("access_token") || null;
    } catch (e) {
      return null;
    }
  });

  const saveAccessToken = (token) => {
    setAccessToken(token);
    try {
      if (token) sessionStorage.setItem("access_token", token);
      else sessionStorage.removeItem("access_token");
    } catch (e) {
      // ignore storage errors
    }
  };

  const clearAuth = () => {
    setAccessToken(null);
    try {
      sessionStorage.removeItem("access_token");
    } catch (e) {
      // ignore
    }
  };

  const value = {
    accessToken,
    saveAccessToken,
    clearAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
