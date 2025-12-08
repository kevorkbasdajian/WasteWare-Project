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
      const endpoint =
        user_type === "company"
          ? "https://wasteware-project-production.up.railway.app/api/auth/company/profile/"
          : "https://wasteware-project-production.up.railway.app/api/auth/profile/";

      const response = await fetch(endpoint, {
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

      // For company endpoint, data is returned directly
      // For user endpoint, data might be nested in result.data
      if (user_type === "company") {
        setUserData(result);
      } else if (result.success && result.data) {
        setUserData(result.data);
      } else if (result.data) {
        setUserData(result.data);
      } else {
        setUserData(result);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setUserError(err.message);
      setUserData(null);
    } finally {
      setIsLoadingUser(false);
    }
  }, [accessToken, user_type]);

  const refreshUserData = async () => {
    if (!accessToken) return;

    try {
      // Determine endpoint based on user_type
      const endpoint =
        user_type === "company"
          ? "https://wasteware-project-production.up.railway.app/api/auth/company/profile/"
          : "https://wasteware-project-production.up.railway.app/api/auth/profile/";

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();

        // Handle different response formats
        if (user_type === "company") {
          setUserData(result);
        } else if (result.success && result.data) {
          setUserData(result.data);
        } else if (result.data) {
          setUserData(result.data);
        } else {
          setUserData(result);
        }
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

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
    set_user_type("");
    try {
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("user_type");
    } catch (e) {}
  };

  const value = {
    accessToken,
    saveAccessToken,
    clearAuth,
    user_type,
    saveusertype,
    userData,
    isLoadingUser,
    userError,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
