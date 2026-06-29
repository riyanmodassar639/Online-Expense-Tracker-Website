import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import logo from "../../assets/logo.png";
 // ✅ adjust path if needed

export default function HeroSection() {
  const [showToast, setShowToast] = useState(false);

  const onAddExpenseClick = () => {
    setShowToast(true);
  };

  useEffect(() => {
    if (!showToast) return;
    const t = setTimeout(() => setShowToast(false), 2000);
    return () => clearTimeout(t);
  }, [showToast]);

  return (
    <section className="hero" id="home">
      {showToast &&
        createPortal(
          <div
            className="loginRequiredToast"
            role="alert"
            style={{
              position: "fixed",
              top: "90px",
              left: "50%",
              transform: "translateX(-50%)",
              padding: "14px 18px",
              borderRadius: "16px",
              background: "rgba(255, 255, 255, 0.10)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              backdropFilter: "blur(14px)",
              boxShadow: "0 30px 80px rgba(0, 0, 0, 0.45)",
              color: "rgba(255, 255, 255, 0.92)",
              fontWeight: 800,
              zIndex: 9999,
              pointerEvents: "none",
            }}
          >
            Login or Register required to add expense.
          </div>,
          document.body
        )}

      {/* ✅ Logo above pill */}
      <div className="heroLogoWrap">
        <img className="heroLogoImg" src={logo} alt="ExpenseTracker Logo" />
      </div>

      <div className="pill">Smart Expense Control</div>

      <h1>
        Manage Your <span>Money</span> Smarter
      </h1>

      <p>Track expenses, manage payments and analyze spending with ease.</p>

      <button className="primary-btn" onClick={onAddExpenseClick}>
        Add Your First Expense
      </button>
    </section>
  );
}
