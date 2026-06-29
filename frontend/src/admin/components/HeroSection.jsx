import Logo from "../../assets/logo.png"; // path adjust accordingly

export default function HeroSection() {
  return (
    <section className="hero" id="home">
      <img src={Logo} alt="ExpenseTracker Admin Logo" className="hero-logo" />

      <div className="pill">Admin Dashboard</div>
      <h1>
        Manage <span>Users</span> & <span>Expenses</span>
      </h1>
      <p>
        Approve users, track expenses, and generate reports in real-time.
      </p>
      <button
        className="primary-btn expense-btn"
        onClick={() =>
          document
            .getElementById("payments")
            .scrollIntoView({ behavior: "smooth" })
        }
      >
        Go to Reports
      </button>
    </section>
  );
}
