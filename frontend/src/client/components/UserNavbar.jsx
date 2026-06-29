import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function UserNavbar() {
  const nav = useNavigate();
  const loc = useLocation();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const profileSrc = useMemo(() => {
    const p = user?.profilePic;
    if (!p) return "";
    if (p.startsWith("http")) return p;
    if (p.startsWith("/uploads")) return `http://localhost:5000${p}`;
    return `http://localhost:5000/uploads/profiles/${p}`;
  }, [user]);

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    nav("/", { replace: true });
  };

  const isActive = (path) => loc.pathname === path;

  return (
    <header className="navbar user-navbar">
      {/* Left */}
      <div className="logo user-logo" onClick={() => nav("/user/dashboard")}>
        ExpenseTracker
      </div>

      {/* Center */}
      <nav className="user-navlinks">
        <span
          className={`user-link ${isActive("/user/dashboard") ? "active" : ""}`}
          onClick={() => nav("/user/dashboard")}
        >
          Dashboard
        </span>

        <span
          className={`user-link ${isActive("/user/expenses") ? "active" : ""}`}
          onClick={() => nav("/user/expenses")}
        >
          Expenses
        </span>
      </nav>

      {/* Right */}
      <div className="user-actions">
        <button className="user-btn user-btn-blue" onClick={() => nav("/user/profile")}>
          {profileSrc ? (
            <img className="user-avatar" src={profileSrc} alt="profile" />
          ) : (
            <span className="user-avatar placeholder" />
          )}
          <span>Profile</span>
        </button>

        <button className="user-btn user-btn-green" onClick={logout}>
          Logout
        </button>
      </div>

      <style>{`
        /* ✅ navbar smaller */
        .user-navbar{
          width:100%;
          display:flex;
          align-items:center;
          justify-content:space-between;
          padding: 16px 48px;
        }

        /* ✅ logo smaller */
        .user-logo{
          font-size: 36px;
          font-weight: 900;
          letter-spacing: 0.5px;
          color:#38bdf8;
          cursor:pointer;
        }

        /* ✅ center links */
        .user-navlinks{
          display:flex;
          gap:28px;
          align-items:center;
          justify-content:center;
          flex:1;
        }

        /* ✅ links default white, hover blue */
        .user-link{
          color:#ffffff;
          font-weight: 800;
          font-size: 18px;
          cursor:pointer;
          transition: color .15s ease;
        }
        .user-link:hover{ color:#38bdf8; }
        .user-link.active{ color:#ffffff; }

        /* ✅ buttons smaller + same size */
        .user-actions{
          display:flex;
          align-items:center;
          gap:12px;
        }

        .user-btn{
          height: 40px;
          min-width: 135px;
          padding: 0 18px;
          border:none;
          border-radius:999px;
          cursor:pointer;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap:10px;
          font-weight: 900;
          font-size: 16px;
          color:#0b1220;
          transition: transform .08s ease, filter .15s ease;
        }
        .user-btn:active{ transform: scale(.98); }
        .user-btn:hover{ filter: brightness(1.03); }

        .user-btn-blue{ background:#38bdf8; }
        .user-btn-green{ background:#22c55e; }

        .user-avatar{
          width: 30px;
          height: 30px;
          border-radius:999px;
          object-fit:cover;
          border:2px solid rgba(255,255,255,.65);
        }
        .user-avatar.placeholder{
          background: rgba(255,255,255,0.25);
          border: 2px solid rgba(255,255,255,0.35);
          display:inline-block;
        }

        @media (max-width: 900px){
          .user-navbar{ padding: 14px 20px; }
          .user-logo{ font-size: 28px; }
          .user-link{ font-size: 15px; }
          .user-btn{ height: 38px; min-width: 120px; font-size: 15px; }
          .user-avatar{ width: 26px; height: 26px; }
        }
      `}</style>
    </header>
  );
}
