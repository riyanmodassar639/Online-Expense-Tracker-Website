import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import "../styles/auth.css";

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", form);

      localStorage.setItem("user", JSON.stringify(res.data.user));
      nav("/user");
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || "Login failed";

      if (status === 403) {
        nav("/", { state: { toast: "Please wait until admin approve your request." } });
        return;
      }

      setMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authRoot">
      <div className="authCard">
        <h2 className="authTitle">Login</h2>
        <p className="authSub">Login to continue (admin approval required).</p>

        {msg ? <div className="authMsg">{msg}</div> : null}

        <form onSubmit={onSubmit} className="authForm">
          <label className="authLabel">Username</label>
          <input
            className="authInput"
            name="username"
            value={form.username}
            onChange={onChange}
            placeholder="Enter username"
            required
          />

          <label className="authLabel">Password</label>
          <input
            className="authInput"
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            placeholder="Enter password"
            required
          />

          <button className="authBtn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="authBottom">
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </div>

        <div className="authBottom" style={{ marginTop: 8 }}>
          <Link to="/">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
