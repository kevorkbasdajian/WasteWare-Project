import { useContext } from "react";
import { AuthContext } from "./AuthProvider";
import { useNavigate } from "react-router-dom";

export const useFetchWithAuth = () => {
  const { accessToken, clearAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchWithAuth = async (url, options = {}) => {
    const headers = options.headers || {};
    headers["Accept"] = "application/json";

    // ✅ CRITICAL FIX: Only set Content-Type if body is NOT FormData
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    // If body IS FormData, don't set Content-Type - let browser set it with boundary

    // Prefer in-memory token from context, fallback to sessionStorage
    const token =
      accessToken ||
      (() => {
        try {
          return sessionStorage.getItem("access_token");
        } catch (e) {
          return null;
        }
      })();

    console.log(
      "Token being sent:",
      token ? token.substring(0, 20) + "..." : "NO TOKEN"
    );

    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const resp = await fetch(url, { ...options, headers });
      const contentType = resp.headers.get("content-type") || "";

      if (resp.status === 404) {
        throw new Error(`Resource not found: ${url}`);
      }

      // Only check HTML response for auth-related errors
      if (resp.status === 401 || resp.status === 403) {
        // If it's JSON 401/403, clear auth and redirect
        clearAuth();
        navigate("/login", { replace: true });
        throw new Error("Unauthorized: Access token invalid or expired");
      }
      return resp;
    } catch (err) {
      console.error("Fetch failed:", err);
      throw err;
    }
  };

  return fetchWithAuth;
};
