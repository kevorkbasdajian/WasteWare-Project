import React, { createContext, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null); // store in memory

  const saveAccessToken = (token) => setAccessToken(token);
  const clearAuth = () => setAccessToken(null);

  const value = {
    accessToken,
    saveAccessToken,
    clearAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
