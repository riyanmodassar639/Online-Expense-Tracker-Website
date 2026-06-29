import "./../styles/admin.css";

export default function AdminNavbar({ onLogout }) {
  return (
    <nav className="admin-navbar">
      <div className="admin-navbar-left">
        Admin Panel
      </div>

      <div className="admin-navbar-center">
        <span className="admin-nav-link active">Users</span>
      </div>

      <div className="admin-navbar-right">
        <button className="admin-logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
