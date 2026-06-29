import { useState } from "react";
import AdminLoginModal from "../components/AdminLoginModal";
import "../styles/admin.css";

export default function AdminLanding() {
  const [open, setOpen] = useState(false);

  return (
    <div className="adminRoot">
      <div className="adminPublicMain">
        <div className="adminContainer">
          <div className="adminCard">
            <h2 style={{ margin: 0, fontSize: 44, fontWeight: 900 }}>Admin Panel</h2>
            <p style={{ marginTop: 10, opacity: 0.85, fontWeight: 700 }}>
              Admin login karo aur dashboard open karo.
            </p>

            <button
              className="adminBtn adminBtnRegister"
              style={{ marginTop: 14 }}
              onClick={() => setOpen(true)}
            >
              Admin Login
            </button>
          </div>
        </div>
      </div>

      {open ? <AdminLoginModal onClose={() => setOpen(false)} /> : null}
    </div>
  );
}
