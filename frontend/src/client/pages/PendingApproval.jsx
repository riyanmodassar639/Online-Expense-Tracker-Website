import { Link, useLocation } from "react-router-dom";
import "../styles/auth.css";

export default function PendingApproval() {
  const loc = useLocation();
  const msg = loc.state?.message || "Admin approval required. Please wait.";

  return (
    <div className="authRoot">
      <div className="authCard">
        <h2 className="authTitle">Approval Pending</h2>
        <p className="authSub">{msg}</p>

        <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="authLinkBtn" to="/login">Try Login Again</Link>
          <Link className="authLinkBtn" to="/">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
