import { NavLink, Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import "../styles/admin.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [openUsers, setOpenUsers] = useState(false);
  const ddRef = useRef(null);

  const logout = () => {
    localStorage.removeItem("adminAuth");
    localStorage.removeItem("adminUser");
    navigate("/admin");
  };

  // ✅ hide navbar on landing/login route (admin login page)
  const hideNavbar =
    location.pathname === "/admin" || location.pathname === "/admin/login";

  // close dropdown on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (!ddRef.current) return;
      if (!ddRef.current.contains(e.target)) setOpenUsers(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // close when route changes
  useEffect(() => {
    setOpenUsers(false);
  }, [location.pathname, location.search]);

  return (
    <div className="adminRoot">
      {!hideNavbar ? (
        <header className="adminNavbar">
          {/* Left: Brand */}
          <div className="adminBrand" onClick={() => navigate("/admin/dashboard")}>
            <span className="adminBrandText">Admin Panel</span>
          </div>

          {/* Center: Links */}
          <nav className="adminNavLinks">
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => (isActive ? "adminNavLink active" : "adminNavLink")}
            >
              Dashboard
            </NavLink>

            {/* Users dropdown */}
            <div className="adminDropdown" ref={ddRef}>
              <button
                type="button"
                className="adminNavLink adminDropdownBtn"
                onClick={() => setOpenUsers((v) => !v)}
              >
                Users <span className={`adminArrow ${openUsers ? "open" : ""}`}>▾</span>
              </button>

              {openUsers ? (
                <div className="adminDropdownMenu">
                  <Link className="adminDropdownItem" to="/admin/users?status=all">
                    All
                  </Link>
                  <Link className="adminDropdownItem" to="/admin/users?status=active">
                    Active
                  </Link>
                  <Link className="adminDropdownItem" to="/admin/users?status=inactive">
                    Inactive
                  </Link>
                  <Link className="adminDropdownItem" to="/admin/users?status=blocked">
                    Blocked
                  </Link>
                  <Link className="adminDropdownItem" to="/admin/users?status=deleted">
                    Deleted
                  </Link>
                </div>
              ) : null}
            </div>

            {/* ✅ Payments AFTER Users */}
            <NavLink
              to="/admin/payments"
              className={({ isActive }) => (isActive ? "adminNavLink active" : "adminNavLink")}
            >
              Payments
            </NavLink>
          </nav>

          {/* Right: Logout */}
          <div className="adminNavActions">
            <button className="adminBtn adminBtnLogin" onClick={logout}>
              Logout
            </button>
          </div>
        </header>
      ) : null}

      <main className="adminMain">
        <div className="adminContainer">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
