import { useState } from "react";
import { adminLogin } from "../services/adminApi";

export default function AdminLoginForm({ onClose }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const res = await adminLogin({ username, password });

      if (res.data.success) {
        localStorage.setItem("admin", JSON.stringify(res.data.admin));
        window.location.href = "/admin/dashboard";
      }
    } catch (err) {
      setError("Invalid admin credentials");
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Admin Login</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <input
          type="text"
          placeholder="Admin Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="primary-btn" onClick={handleLogin}>
          Login
        </button>

        <button className="close-btn" onClick={onClose}>
          X
        </button>
      </div>
    </div>
  );
}
