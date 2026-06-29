// src/client/components/RegisterForm.jsx
import { FaWhatsapp, FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter, FaYoutube } from "react-icons/fa";

// Full country list (emoji flags), Israel excluded
const countries = [
  { name: "United States", code: "+1", flag: "🇺🇸" },
  { name: "Pakistan", code: "+92", flag: "🇵🇰" },
  { name: "United Kingdom", code: "+44", flag: "🇬🇧" },
  { name: "India", code: "+91", flag: "🇮🇳" },
  { name: "Germany", code: "+49", flag: "🇩🇪" },
  { name: "France", code: "+33", flag: "🇫🇷" },
  { name: "Canada", code: "+1", flag: "🇨🇦" },
  { name: "Australia", code: "+61", flag: "🇦🇺" },
  // ... add more countries ...
  // skip Israel
];

export default function RegisterForm({ onClose }) {
  return (
    <div className="modal">
      <div className="modal-content register">
        <h2>Register / Signup</h2>

        <div className="form-row">
          <input type="text" placeholder="First Name" />
          <input type="text" placeholder="Last Name" />
        </div>

        <input type="number" placeholder="Age" />
        <input type="email" placeholder="Email" />

        <div className="form-row">
          <select>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} ({c.code})
              </option>
            ))}
          </select>
          <input type="tel" placeholder="Phone Number" />
        </div>

        <input type="password" placeholder="Create Password" />
        <input type="password" placeholder="Re-enter Password" />
        <input type="file" accept="image/*" />

        <button className="primary-btn">Register</button>

        {/* Apps symbols */}
        <div className="apps-icons">
          <a href="#"><FaWhatsapp /></a>
          <a href="#"><FaFacebookF /></a>
          <a href="#"><FaInstagram /></a>
          <a href="#"><FaLinkedinIn /></a>
          <a href="#"><FaTwitter /></a>
          <a href="#"><FaYoutube /></a>
        </div>

        <button onClick={onClose} className="close-btn">X</button>
      </div>
    </div>
  );
}
