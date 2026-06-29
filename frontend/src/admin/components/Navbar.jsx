export default function Navbar({ onAdminLoginClick }) {
  const go = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="navbar">
      <div
        className="logo"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        ExpenseTracker
      </div>

      <nav>
        <a onClick={() => go("home")}>Home</a>
        <a onClick={() => go("features")}>Features</a>
        <a onClick={() => go("how")}>How It Works</a>
        <a onClick={() => go("payments")}>Reports</a>
        <a onClick={() => go("contact")}>Contact</a>
      </nav>

      <div className="nav-right">
        <button className="nav-btn" onClick={onAdminLoginClick}>
          Admin Login
        </button>
      </div>
    </div>
  );
}
