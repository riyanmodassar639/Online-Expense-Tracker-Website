import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const go = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="navbar">
      <div className="logo">ExpenseTracker</div>

      <nav>
        <a onClick={() => go("home")}>Home</a>
        <a onClick={() => go("features")}>Features</a>
        <a onClick={() => go("how")}>How It Works</a>
        <a onClick={() => go("payments")}>Payments</a>
        <a onClick={() => go("contact")}>Contact</a>
      </nav>

      <div className="nav-right" style={{ display: "flex", gap: 12 }}>
        <button
          style={{
            padding: "12px 26px",
            borderRadius: 999,
            border: "none",
            background: "#38bdf8",
            color: "#06202a",
            fontWeight: 900,
            cursor: "pointer",
          }}
          onClick={() => navigate("/login")}
        >
          Login
        </button>

        <button
          style={{
            padding: "12px 26px",
            borderRadius: 999,
            border: "none",
            background: "#22c55e",
            color: "#06202a",
            fontWeight: 900,
            cursor: "pointer",
          }}
          onClick={() => navigate("/register")}
        >
          Register
        </button>
      </div>
    </div>
  );
}
