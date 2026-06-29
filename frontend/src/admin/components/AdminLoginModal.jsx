import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import "../styles/admin.css";

export default function AdminLoginModal({ onClose }) {
  const nav = useNavigate();
  const [form, setForm] = useState({ username: "admin", password: "admin123" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const res = await api.post("/admin/login", form);
      // backend hardcoded admin - token optional
      localStorage.setItem("adminAuth", "true");
      localStorage.setItem("adminUser", JSON.stringify(res.data || { username: "admin" }));
      onClose?.();
      nav("/admin/dashboard");
    } catch (err) {
      setMsg(err?.response?.data?.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adminModalOverlay" onMouseDown={onClose}>
      <div className="adminModalCard" onMouseDown={(e) => e.stopPropagation()}>
        <button className="adminModalClose" onClick={onClose} type="button">
          ✕
        </button>

        <h2 className="adminModalTitle">Admin Login</h2>
        <p className="adminModalSub">Login to open admin panel.</p>

        {msg ? <div className="adminModalMsg">{msg}</div> : null}

        <form onSubmit={onSubmit} className="adminModalForm">
          <label className="adminModalLabel">Username</label>
          <input
            className="adminModalInput"
            name="username"
            value={form.username}
            onChange={onChange}
            required
          />

          <label className="adminModalLabel">Password</label>
          <input
            className="adminModalInput"
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            required
          />

          <button className="adminModalBtn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
