import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

export default function AdminUsers() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("all");
  const [err, setErr] = useState("");

  const host = useMemo(() => window.location.hostname, []);

  const absUrl = (p) => {
    if (!p) return "";
    if (p.startsWith("http")) return p;
    if (p.startsWith("/uploads")) return `http://${host}:5000${p}`;
    return `http://${host}:5000/uploads/${p}`;
  };

  const fetchUsers = async () => {
    try {
      setErr("");
      setLoading(true);
      const { data } = await api.get(`/admin/users?status=${status}`);
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log("Fetch users error:", e?.response?.data || e.message);
      setErr(e?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const doAction = async (type, userId) => {
    try {
      setErr("");
      if (type === "approve") await api.put(`/admin/approve/${userId}`);
      if (type === "inactive") await api.put(`/admin/inactive/${userId}`);
      if (type === "block") await api.put(`/admin/block/${userId}`);
      if (type === "delete") await api.put(`/admin/delete/${userId}`);

      await fetchUsers();
    } catch (e) {
      console.log("User action error:", e?.response?.data || e.message);
      alert(e?.response?.data?.message || "Action failed");
    }
  };

  return (
    <div className="admin-users-page">
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Users</h2>
            <p>Users list + approve / inactive / block / delete.</p>
          </div>

          <div className="head-actions">
            <select
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
              <option value="deleted">Deleted</option>
            </select>

            <button type="button" className="btn btn-white" onClick={fetchUsers} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {err ? <div className="error">{err}</div> : null}

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>ID</th>
                <th style={{ width: 120 }}>Profile</th>
                <th style={{ width: 220 }}>Username</th>
                <th>Email</th>
                <th style={{ width: 160 }}>Phone</th>
                <th style={{ width: 140 }}>Status</th>
                <th style={{ width: 420, textAlign: "right" }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {!loading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty">
                    No users found.
                  </td>
                </tr>
              ) : null}

              {users.map((u) => {
                const avatar = absUrl(u.profilePic);
                return (
                  <tr key={u.id}>
                    <td className="mono">{u.id}</td>

                    <td>
                      {avatar ? <img className="avatar" src={avatar} alt="profile" /> : <div className="avatar ph" />}
                    </td>

                    <td className="uname">{u.username || "-"}</td>

                    <td className="email">{u.email || "-"}</td>

                    <td className="mono">{u.phone || "-"}</td>

                    <td>
                      <span className={`pill ${String(u.status || "").toLowerCase()}`}>{u.status || "-"}</span>
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <div className="actions">
                        <button type="button" className="btn btn-green" onClick={() => doAction("approve", u.id)}>
                          Approve
                        </button>

                        <button type="button" className="btn btn-gray" onClick={() => doAction("inactive", u.id)}>
                          Inactive
                        </button>

                        <button type="button" className="btn btn-yellow" onClick={() => doAction("block", u.id)}>
                          Block
                        </button>

                        <button
                          type="button"
                          className="btn btn-red"
                          onClick={() => {
                            if (confirm("Delete this user (soft delete)?")) doAction("delete", u.id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .admin-users-page{ padding: 26px 26px 40px; }
        .panel{
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 24px;
          padding: 26px;
          box-shadow: 0 18px 55px rgba(0,0,0,.25);
        }
        .panel-head{
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap:16px;
          margin-bottom: 18px;
        }
        h2{ margin:0; color:#fff; font-size: 38px; letter-spacing: .2px; }
        p{ margin:6px 0 0; color: rgba(255,255,255,.70); font-size: 18px; font-weight: 700; }

        .head-actions{
          display:flex;
          align-items:center;
          gap:12px;
        }

        .select{
          height: 48px;
          border-radius: 999px;
          padding: 0 14px;
          border: 1px solid rgba(255,255,255,.18);
          background: rgba(0,0,0,.25);
          color:#fff;
          font-weight: 900;
          outline:none;
        }

        .error{ margin: 10px 0 16px; color: #ffb4b4; font-weight: 800; }

        .table-wrap{ overflow:auto; border-radius: 18px; }
        .table{ width:100%; border-collapse: collapse; min-width: 1050px; }
        thead th{
          text-align:left;
          padding: 14px 14px;
          color: rgba(255,255,255,.75);
          font-weight: 900;
          border-bottom: 1px solid rgba(255,255,255,0.12);
        }
        tbody td{
          padding: 18px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.92);
          vertical-align: middle;
        }
        .empty{ padding: 22px 14px; color: rgba(255,255,255,.70); font-weight: 800; }

        .mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace; }
        .uname{ font-weight: 900; font-size: 18px; }
        .email{ color: rgba(255,255,255,.85); font-weight: 800; }

        .avatar{
          width: 54px;
          height: 54px;
          border-radius: 999px;
          object-fit: cover;
          border: 2px solid rgba(255,255,255,.28);
        }
        .avatar.ph{
          background: rgba(255,255,255,.12);
          border: 2px solid rgba(255,255,255,.18);
        }

        .pill{
          display:inline-flex;
          align-items:center;
          padding: 8px 14px;
          border-radius: 999px;
          font-weight: 900;
          text-transform: lowercase;
          border: 1px solid rgba(255,255,255,.18);
          background: rgba(255,255,255,.08);
        }
        .pill.active{ background: rgba(34,197,94,.18); border-color: rgba(34,197,94,.35); }
        .pill.inactive{ background: rgba(255,255,255,.10); }
        .pill.blocked{ background: rgba(245,158,11,.18); border-color: rgba(245,158,11,.35); }
        .pill.deleted{ background: rgba(239,68,68,.18); border-color: rgba(239,68,68,.35); }

        .actions{
          display:flex;
          justify-content:flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btn{
          border:none;
          cursor:pointer;
          padding: 10px 14px;
          border-radius: 999px;
          font-weight: 900;
          min-width: 100px;
          transition: transform .08s ease, filter .15s ease;
        }
        .btn:active{ transform: scale(.98); }
        .btn:hover{ filter: brightness(1.04); }

        .btn-white{
          background:#fff; color:#0b1220;
          min-width: 130px; padding: 14px 18px; font-size: 18px;
        }
        .btn-green{ background:#22c55e; color:#0b1220; }
        .btn-gray{ background: rgba(255,255,255,.20); color:#fff; }
        .btn-yellow{ background:#f59e0b; color:#0b1220; }
        .btn-red{ background:#ef4444; color:#fff; }

        @media (max-width: 900px){
          h2{ font-size: 30px; }
          .btn-white{ font-size: 16px; }
        }
      `}</style>
    </div>
  );
}
