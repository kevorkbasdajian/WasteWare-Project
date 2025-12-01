import React, { createContext, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => {
    try {
      return sessionStorage.getItem("access_token") || null;
    } catch (e) {
      return null;
    }
  });
  const [user_type, set_user_type] = useState(() => {
    try {
      return sessionStorage.getItem("user_type") || "";
    } catch (e) {
      return "";
    }
  });
  const saveusertype = (type) => {
    set_user_type(type);
    try {
      sessionStorage.setItem("user_type", type);
    } catch (e) {}
  };

  const saveAccessToken = (token) => {
    setAccessToken(token);
    try {
      if (token) sessionStorage.setItem("access_token", token);
      else sessionStorage.removeItem("access_token");
    } catch (e) {}
  };

  const clearAuth = () => {
    setAccessToken(null);
    try {
      sessionStorage.removeItem("access_token");
    } catch (e) {}
  };

  const value = {
    accessToken,
    saveAccessToken,
    clearAuth,
    user_type,
    saveusertype,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
