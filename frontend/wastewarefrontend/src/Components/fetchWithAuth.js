import { useContext } from "react";
import { AuthContext } from "./AuthProvider";
import { useNavigate } from "react-router-dom";

export const useFetchWithAuth = () => {
  const { accessToken, clearAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchWithAuth = async (url, options = {}) => {
    const headers = options.headers || {};

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

    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const resp = await fetch(url, { ...options, headers });

      if (resp.status === 401) {
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
