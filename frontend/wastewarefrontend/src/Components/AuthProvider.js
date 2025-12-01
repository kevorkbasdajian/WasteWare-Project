import React, { createContext, useState, useEffect, useCallback } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => {
    try {
      return sessionStorage.getItem("access_token") || null;
    } catch (e) {
      return null;
    }
  });

  const [userData, setUserData] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [userError, setUserError] = useState(null);

  // Fetch user profile data
  const fetchUserData = useCallback(async () => {
    if (!accessToken) {
      setUserData(null);
      return;
    }

    setIsLoadingUser(true);
    setUserError(null);

    try {
      const response = await fetch("http://localhost:8000/api/auth/profile/", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Token is invalid, clear auth
          clearAuth();
          throw new Error("Session expired");
        }
        throw new Error("Failed to fetch user data");
      }

      const result = await response.json();

      if (result.success && result.data) {
        setUserData(result.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setUserError(err.message);
      setUserData(null);
    } finally {
      setIsLoadingUser(false);
    }
  }, [accessToken]);

  // Fetch user data when token changes
  useEffect(() => {
    if (accessToken) {
      fetchUserData();
    } else {
      setUserData(null);
    }
  }, [accessToken, fetchUserData]);

  const saveAccessToken = (token) => {
    setAccessToken(token);
    try {
      if (token) sessionStorage.setItem("access_token", token);
      else sessionStorage.removeItem("access_token");
    } catch (e) {}
  };

  const clearAuth = () => {
    setAccessToken(null);
    setUserData(null);
    setUserError(null);
    try {
      sessionStorage.removeItem("access_token");
    } catch (e) {}
  };

  const value = {
    accessToken,
    saveAccessToken,
    clearAuth,
    userData,
    isLoadingUser,
    userError,
    refetchUserData: fetchUserData, // Allow manual refresh
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
