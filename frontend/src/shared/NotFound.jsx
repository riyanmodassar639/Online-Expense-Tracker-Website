import { Link, useLocation } from "react-router-dom";

export default function NotFound() {
  const location = useLocation();
  return (
    <div style={{ padding: 20 }}>
      <h2>404 - Page Not Found</h2>
      <p style={{ opacity: 0.7 }}>
        No route matched: <b>{location.pathname}</b>
      </p>
      <Link to="/">Go Home</Link>
    </div>
  );
}
