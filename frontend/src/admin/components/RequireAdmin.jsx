import { Navigate } from "react-router-dom";

export default function RequireAdmin({ children }) {
  const ok = localStorage.getItem("adminAuth") === "true";
  if (!ok) return <Navigate to="/admin" replace />;
  return children;
}
