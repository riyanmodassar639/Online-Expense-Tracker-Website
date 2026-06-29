// LoginForm.jsx
import { FaWhatsapp, FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter, FaYoutube } from "react-icons/fa";

export default function LoginForm({ onClose }) {
  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Login</h2>
        <input type="text" placeholder="Username" />
        <input type="password" placeholder="Password" />
        <button className="primary-btn">Login</button>

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
