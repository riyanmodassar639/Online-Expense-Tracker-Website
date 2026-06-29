import React from "react";

/** Clean rounded icon button with SVG */
function SocialIcon({ href = "#", label, children }) {
  return (
    <a
      href={href}
      className="footerSocialBtn"
      aria-label={label}
      title={label}
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  );
}

const IconWhatsApp = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
    <path
      d="M12 3.5a8.5 8.5 0 0 0-7.2 13l-.9 3.2 3.3-.9A8.5 8.5 0 1 0 12 3.5Z"
      stroke="currentColor"
      strokeWidth="1.7"
      opacity="0.95"
    />
    <path
      d="M9.7 8.9c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.6 1.5c.1.2.1.4-.1.6l-.4.6c-.1.2-.1.3 0 .5.3.6.8 1.2 1.5 1.9.8.7 1.5 1 2 .8.2-.1.5-.4.6-.6.2-.2.4-.2.6-.1l1.5.7c.2.1.3.3.3.5-.2.7-.7 1.3-1.4 1.7-.8.4-1.7.4-2.7 0-1.5-.5-3-1.6-4.2-3-1.2-1.5-1.8-3.1-1.9-4.2 0-.7 0-1.4.4-2Z"
      fill="currentColor"
      opacity="0.95"
    />
  </svg>
);

const IconFacebook = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
    <path
      d="M13.6 21v-7.6h2.5l.4-3h-2.9V8.6c0-.9.2-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 4v2.1H8v3h2.6V21h3Z"
      fill="currentColor"
      opacity="0.95"
    />
  </svg>
);

const IconInstagram = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
    <path
      d="M7.4 3.8h9.2a4.2 4.2 0 0 1 4.2 4.2v8a4.2 4.2 0 0 1-4.2 4.2H7.4A4.2 4.2 0 0 1 3.2 16V8a4.2 4.2 0 0 1 4.2-4.2Z"
      stroke="currentColor"
      strokeWidth="1.7"
      opacity="0.95"
    />
    <path
      d="M12 9a3.2 3.2 0 1 0 0 6.4A3.2 3.2 0 0 0 12 9Z"
      stroke="currentColor"
      strokeWidth="1.7"
      opacity="0.95"
    />
    <path
      d="M16.9 7.3h.01"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

const IconLinkedIn = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
    <path
      d="M6.3 10.2H3.8V20.6h2.5V10.2Zm-.1-3.7a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0ZM20.7 20.6h-2.5v-5.4c0-1.3-.5-2.1-1.7-2.1-1 0-1.6.7-1.9 1.3-.1.2-.1.5-.1.9v5.3H12V10.2h2.4v1.4c.4-.7 1.2-1.7 2.9-1.7 2.2 0 3.4 1.4 3.4 3.9v6.8Z"
      fill="currentColor"
      opacity="0.95"
    />
  </svg>
);

const IconX = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
    <path
      d="M18.6 4.2h2l-6 6.9 6.4 8.7h-4.4l-4-5.5-4.8 5.5H4.8l6.4-7.3-6-8.3h4.6l3.6 5 4.2-5Z"
      fill="currentColor"
      opacity="0.95"
    />
  </svg>
);

const IconYouTube = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
    <path
      d="M21 12s0-3.2-.4-4.7c-.2-.9-.9-1.6-1.8-1.8C17.2 5 12 5 12 5s-5.2 0-6.8.5c-.9.2-1.6.9-1.8 1.8C3 8.8 3 12 3 12s0 3.2.4 4.7c.2.9.9 1.6 1.8 1.8C6.8 19 12 19 12 19s5.2 0 6.8-.5c.9-.2 1.6-.9 1.8-1.8.4-1.5.4-4.7.4-4.7Z"
      stroke="currentColor"
      strokeWidth="1.7"
      opacity="0.95"
    />
    <path
      d="M10.4 9.8 15 12l-4.6 2.2V9.8Z"
      fill="currentColor"
      opacity="0.95"
    />
  </svg>
);

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* LEFT */}
        <div className="footer-left">
          <h2 className="footer-logo">Expense Tracker</h2>
          <p>Expense Tracker helps you to track your daily</p>
          <p>Budget.</p>
          <p>Best Platform To stroe your Budget Info.</p>
        </div>

        {/* MIDDLE (2 columns, each 3 items vertically) */}
        <div className="footer-middle">
          <div className="footer-links">
            <a href="#" className="footerLink">WhatsApp</a>
            <a href="#" className="footerLink">Instagram</a>
            <a href="#" className="footerLink">X Corp</a>
          </div>

          <div className="footer-links">
            <a href="#" className="footerLink">Facebook</a>
            <a href="#" className="footerLink">LinkedIn</a>
            <a href="#" className="footerLink">YouTube</a>
          </div>
        </div>

        {/* RIGHT */}
        <div className="footer-right">
          <button
            className="footer-btn"
            style={{ background: "#22c55e", color: "#06202a", border: "none" }}
            onClick={() => (window.location.href = "/register")}
          >
            Register For free
          </button>

          <button
            className="footer-btn"
            style={{
              background: "#38bdf8",
              color: "#06202a",
              border: "none",
              marginTop: 14,
            }}
            onClick={() => (window.location.href = "/login")}
          >
            Login
          </button>

          {/* icons under buttons */}
          <div className="footer-social">
            <SocialIcon label="WhatsApp"><IconWhatsApp /></SocialIcon>
            <SocialIcon label="Facebook"><IconFacebook /></SocialIcon>
            <SocialIcon label="Instagram"><IconInstagram /></SocialIcon>
            <SocialIcon label="LinkedIn"><IconLinkedIn /></SocialIcon>
            <SocialIcon label="X"><IconX /></SocialIcon>
            <SocialIcon label="YouTube"><IconYouTube /></SocialIcon>
          </div>
        </div>
      </div>

      <p className="footer-copy">© 2026 ExpenseTracker Admin. All rights reserved.</p>
    </footer>
  );
}
