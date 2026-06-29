import { Navigate } from "react-router-dom";

export default function RequireUser({ children }) {
  const user = localStorage.getItem("user"); // login ke baad user save hota hai
  if (!user) return <Navigate to="/" replace />;
  return children;
}
