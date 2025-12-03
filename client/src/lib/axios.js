import axios from "axios";

// Base URL strategy:
// - If window.__ENV__.VITE_API_BASE_URL is set (runtime), use it
// - Else if VITE_API_BASE_URL is set at build time, use it
// - Else fall back to '/api' so Vite's dev proxy handles local requests
const runtime = typeof window !== "undefined" ? window.__ENV__ : undefined;
const runtimeUrl = runtime?.VITE_API_BASE_URL;
const viteUrl = import.meta.env.VITE_API_BASE_URL;
const baseURL = (runtimeUrl || viteUrl || "/api").replace(/\/$/, "");

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  // You can tune timeouts here if desired
  timeout: 15000,
});

// Basic response error normalization
api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Keep a normalized message for UI
    error.normalizedMessage =
      error.response?.data?.error || error.message || "Request failed";
    return Promise.reject(error);
  }
);

export default api;
