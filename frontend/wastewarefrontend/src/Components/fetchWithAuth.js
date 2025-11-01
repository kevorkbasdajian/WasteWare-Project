import { useContext } from "react";
import { AuthContext } from "./AuthProvider";

export const useFetchWithAuth = () => {
  const { accessToken, saveAccessToken, clearAuth } = useContext(AuthContext);

  const refreshAccessToken = async () => {
    // If server stores refresh token in HttpOnly cookie, just call refresh endpoint
    const res = await fetch("http://localhost:8000/api/auth/token/refresh/", {
      method: "POST",
      credentials: "include", // important: send cookies
      headers: { "Content-Type": "application/json" },
      // If backend requires body, send {"refresh": "<token>"} (not needed if using cookie)
    });
    if (!res.ok) throw new Error("Refresh failed");
    const data = await res.json();
    saveAccessToken(data.access);
    return data.access;
  };

  const fetchWithAuth = async (url, options = {}) => {
    const headers = options.headers || {};
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

    const resp = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
    if (resp.status !== 401) return resp;

    // 401 -> try refresh once
    try {
      const newAccess = await refreshAccessToken();
      headers["Authorization"] = `Bearer ${newAccess}`;
      const retryResp = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });
      return retryResp;
    } catch (e) {
      // failed to refresh -> logout
      clearAuth();
      throw e;
    }
  };

  return fetchWithAuth;
};
