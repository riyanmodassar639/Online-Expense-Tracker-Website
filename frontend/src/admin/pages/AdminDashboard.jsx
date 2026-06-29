import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    approvedUsers: 0,
    totalPayments: 0,
    totalExpenses: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (e) {
      // ignore for now
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const t = setInterval(fetchStats, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="adminCard">
      <h2 style={{ margin: 0, fontSize: 44, fontWeight: 900 }}>Dashboard</h2>
      <p style={{ marginTop: 10, opacity: 0.85, fontWeight: 700 }}>
        Approved users, payments aur expenses ka live record.
      </p>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        <Box title="Total Approved Users" value={loading ? "..." : stats.approvedUsers} />
        <Box title="Total Payments (Rs)" value={loading ? "..." : `Rs ${stats.totalPayments}`} />
        <Box title="Total Expenses" value={loading ? "..." : stats.totalExpenses} />
      </div>
    </div>
  );
}

function Box({ title, value }) {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: 18,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      <div style={{ opacity: 0.8, fontWeight: 800 }}>{title}</div>
      <div style={{ fontSize: 34, fontWeight: 900, marginTop: 6 }}>{value}</div>
    </div>
  );
}
