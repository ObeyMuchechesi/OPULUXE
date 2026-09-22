import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("opuluxe_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAdminArea = window.location.pathname.startsWith("/admin");
    if (
      err.response?.status === 401 &&
      localStorage.getItem("opuluxe_token") &&
      isAdminArea
    ) {
      localStorage.removeItem("opuluxe_token");
      localStorage.removeItem("opuluxe_admin");
      window.location.href = "/admin/login";
    }
    return Promise.reject(err);
  }
);

export default api;
