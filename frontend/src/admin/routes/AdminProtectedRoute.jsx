import { Navigate, Outlet } from "react-router-dom";

export default function AdminProtectedRoute() {
  const isAdmin = localStorage.getItem("adminAuth") === "true";
  return isAdmin ? <Outlet /> : <Navigate to="/admin/login" replace />;
}
