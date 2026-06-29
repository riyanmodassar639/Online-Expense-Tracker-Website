import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/user.css";

export default function UserHome() {
  const nav = useNavigate();

  // ✅ if no user in localStorage, redirect to login
  useEffect(() => {
    const u = localStorage.getItem("user");
    if (!u) nav("/login");
  }, [nav]);

  return (
    <div className="userRoot">
      <div className="userCard">
        <h1 className="userTitle">User Dashboard</h1>
        <p className="userLine">Yahan user ka dashboard aayega (baad mein complete karein ge).</p>
      </div>
    </div>
  );
}
