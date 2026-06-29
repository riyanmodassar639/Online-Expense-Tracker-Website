import { useState } from "react";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import Features from "../components/Features";
import Stats from "../components/Stats";
import HowItWorks from "../components/HowItWorks";
import PaymentSection from "../components/PaymentSection";
import Testimonials from "../components/Testimonials";
import ContactUs from "../components/ContactUs";
import Footer from "../components/Footer";
import AdminLoginForm from "../components/AdminLoginForm";

export default function AdminHome() {
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  return (
    <>
      <div className="page-content">
        <Navbar onAdminLoginClick={() => setShowAdminLogin(true)} />
        <HeroSection />
        <Features />
        <Stats />
        <HowItWorks />
        <PaymentSection />
        <Testimonials />
        <ContactUs />
      </div>

      <Footer onAdminLoginClick={() => setShowAdminLogin(true)} />

      {showAdminLogin && (
        <AdminLoginForm onClose={() => setShowAdminLogin(false)} />
      )}
    </>
  );
}
