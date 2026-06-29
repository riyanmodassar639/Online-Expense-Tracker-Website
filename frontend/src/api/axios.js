import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;

export const api = axios.create({
  baseURL: API_BASE,
});

// auto attach userId + token
api.interceptors.request.use((config) => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user?.id) config.headers["x-user-id"] = String(user.id);
  } catch {}

  const token = localStorage.getItem("token");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;

  return config;
});

export default api;
