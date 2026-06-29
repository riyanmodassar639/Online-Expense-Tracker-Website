import {
  FaWhatsapp,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaXTwitter,
} from "react-icons/fa6";

export default function Footer({ onAdminLoginClick }) {
  return (
    <footer className="footer">
      <div className="footer-main">
        {/* LEFT */}
        <div className="footer-left">
          <h2 className="footer-logo">ExpenseTracker Admin</h2>
          <p>
            Admin panel to manage users, monitor expenses,
            and generate detailed reports efficiently.
          </p>
        </div>

        {/* CENTER */}
        <div className="footer-center">
          <a href="#">Dashboard</a>
          <a href="#">Users</a>
          <a href="#">Expenses</a>
          <a href="#">Reports</a>
          <a href="#">Settings</a>
          <a href="#">Support</a>
        </div>

        {/* RIGHT */}
        <div className="footer-right">
          {/* Admin Login Button */}
          <button
            className="footer-btn login-btn wide"
            onClick={onAdminLoginClick}
          >
            Admin Login
          </button>

          {/* Social / App Icons */}
          <div className="footer-icons">
            <a href="#"><FaWhatsapp /></a>
            <a href="#"><FaFacebookF /></a>
            <a href="#"><FaInstagram /></a>
            <a href="#"><FaLinkedinIn /></a>
            <a href="#"><FaXTwitter /></a>
            <a href="#"><FaYoutube /></a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © 2026 ExpenseTracker Admin. All rights reserved.
      </div>
    </footer>
  );
}
