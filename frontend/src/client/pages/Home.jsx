import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import Features from "../components/Features";
import Stats from "../components/Stats";
import HowItWorks from "../components/HowItWorks";
import PaymentSection from "../components/PaymentSection";
import Testimonials from "../components/Testimonials";
import ContactUs from "../components/ContactUs";
import Footer from "../components/Footer";

import "../styles/landing.css";

export default function Home() {
  const location = useLocation();
  const [toast, setToast] = useState("");

  useEffect(() => {
    const msg = location.state?.toast;
    if (!msg) return;

    setToast(msg);

    // clear state so refresh doesn't repeat
    window.history.replaceState({}, document.title);

    const t = setTimeout(() => setToast(""), 2000);
    return () => clearTimeout(t);
  }, [location.state]);

  return (
    <div className="landingRoot">
      <Navbar />

      {toast ? (
        <div
          style={{
            position: "fixed",
            top: 95,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "14px 18px",
            borderRadius: 16,
            background: "rgba(255,255,255,0.18)", // ✅ white glassy
            border: "1px solid rgba(255,255,255,0.28)",
            backdropFilter: "blur(14px)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
            color: "rgba(255,255,255,0.95)",
            fontWeight: 900,
            zIndex: 9999,
            maxWidth: "min(92vw, 720px)",
            textAlign: "center",
          }}
        >
          {toast}
        </div>
      ) : null}

      <section id="hero">
        <HeroSection />
      </section>

      <section id="features">
        <Features />
      </section>

      <section id="stats">
        <Stats />
      </section>

      <section id="how-it-works">
        <HowItWorks />
      </section>

      <section id="payments">
        <PaymentSection />
      </section>

      <section id="testimonials">
        <Testimonials />
      </section>

      <section id="contact">
        <ContactUs />
      </section>

      <Footer />
    </div>
  );
}
