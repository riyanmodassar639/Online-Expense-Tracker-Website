import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/admin/login", { username, password });

      if (res.data?.success) {
        localStorage.setItem("adminAuth", "true");
        localStorage.setItem("adminUser", JSON.stringify(res.data.admin));
        navigate("/admin/dashboard");
      } else {
        setError("Invalid admin credentials");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <form onSubmit={onSubmit} style={styles.card}>
        <h2 style={styles.title}>Admin Login</h2>

        {error ? <div style={styles.error}>{error}</div> : null}

        <label style={styles.label}>Username</label>
        <input
          style={styles.input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="admin"
        />

        <label style={styles.label}>Password</label>
        <input
          style={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="admin123"
        />

        <button disabled={loading} style={styles.btn}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p style={styles.hint}>
          Default: <b>admin</b> / <b>admin123</b>
        </p>
      </form>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#f5f6f8",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "#fff",
    borderRadius: 14,
    padding: 22,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },
  title: { margin: 0, marginBottom: 14 },
  label: { display: "block", marginTop: 12, fontSize: 14, opacity: 0.8 },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #ddd",
    outline: "none",
    marginTop: 6,
  },
  btn: {
    width: "100%",
    marginTop: 16,
    padding: "10px 12px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
  },
  error: {
    background: "#ffe7e7",
    color: "#a10000",
    padding: "10px 12px",
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  hint: { marginTop: 12, fontSize: 13, opacity: 0.7 },
};
