import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ChartTitle);

export default function UserDashboard() {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState(null);
  const [prefCurrency, setPrefCurrency] = useState("EUR");

  const fetchDashboard = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/users/dashboard?userId=${user.id}`);
      setDash(res.data);

      const all = res.data?.totalsAll || [];
      const firstCur = all?.[0]?.currency;
      const saved = localStorage.getItem("prefCurrency");
      setPrefCurrency(saved || firstCur || "EUR");
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const t = setInterval(fetchDashboard, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, []);

  const amountBy = (arr, cur) => {
    const x = (arr || []).find((r) => r.currency === cur);
    return x ? Number(x.total || 0) : 0;
  };

  const subText = () => {
    const plan = dash?.user?.subscriptionPlan;
    const end = dash?.user?.subscriptionEnd;
    if (!plan || !end) return { name: "Free", note: "No active plan" };

    const endD = new Date(end);
    const ok = endD > new Date();
    if (!ok) return { name: "Expired", note: "Renew subscription to add expenses" };

    return { name: plan.toUpperCase(), note: `Valid until ${endD.toLocaleString()}` };
  };

  const s = subText();

  // ----- Charts data -----
  const totalsAll = dash?.totalsAll || [];
  const totalsMonth = dash?.totalsMonth || [];

  const allChartData = useMemo(() => {
    const labels = totalsAll.map((x) => x.currency);
    const data = totalsAll.map((x) => Number(x.total || 0));
    return {
      labels,
      datasets: [{ label: "All Time Total", data }],
    };
  }, [dash]); // eslint-disable-line

  const monthChartData = useMemo(() => {
    const labels = totalsMonth.map((x) => x.currency);
    const data = totalsMonth.map((x) => Number(x.total || 0));
    return {
      labels,
      datasets: [{ label: "This Month Total", data }],
    };
  }, [dash]); // eslint-disable-line

  const chartOptsBar = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" } },
    scales: { y: { beginAtZero: true } },
  };

  const chartOptsDoughnut = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" } },
  };

  return (
    <div style={{ padding: "26px 34px" }}>
      <h1 style={{ color: "#fff", fontSize: 54, margin: "6px 0 6px" }}>
        Welcome, {user?.username || "User"} 👋
      </h1>
      <div style={{ color: "rgba(255,255,255,.75)", fontWeight: 700, fontSize: 18 }}>
        Manage your expenses, subscription, and recent activity from here.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 0.9fr", gap: 18, marginTop: 26 }}>
        <Card title="TOTAL EXPENSES" badge="All Time">
          {loading ? (
            <BigNumber>...</BigNumber>
          ) : (
            <>
              <BigNumber>
                {prefCurrency} {amountBy(dash?.totalsAll, prefCurrency).toLocaleString()}
              </BigNumber>
              <SmallText>Total entries: {dash?.counts?.all || 0}</SmallText>
              <CurrencyPicker
                value={prefCurrency}
                onChange={(v) => {
                  setPrefCurrency(v);
                  localStorage.setItem("prefCurrency", v);
                }}
              />
            </>
          )}
        </Card>

        <Card title="THIS MONTH" badge="Current">
          {loading ? (
            <BigNumber>...</BigNumber>
          ) : (
            <>
              <BigNumber>
                {prefCurrency} {amountBy(dash?.totalsMonth, prefCurrency).toLocaleString()}
              </BigNumber>
              <SmallText>This month entries: {dash?.counts?.month || 0}</SmallText>
              <SmallText>Month key: {dash?.month}</SmallText>
            </>
          )}
        </Card>

        <Card title="ACCOUNT STATUS" badge="User">
          <BigNumber style={{ textTransform: "lowercase" }}>
            {(dash?.user?.status || user?.status || "active").toLowerCase()}
          </BigNumber>
          <SmallText>If status is inactive/blocked, access can be limited.</SmallText>
        </Card>

        <Card title="SUBSCRIPTION" badge="">
          <BigNumber style={{ fontSize: 34 }}>{s.name}</BigNumber>
          <SmallText>{s.note}</SmallText>
        </Card>
      </div>

      {/* ✅ NEW: Dashboard Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr .9fr", gap: 18, marginTop: 18 }}>
        <div className="cardGlass" style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <h2 style={{ color: "#fff", margin: 0, fontSize: 22 }}>All Time Totals (by currency)</h2>
            <div style={{ color: "rgba(255,255,255,.65)", fontWeight: 800, fontSize: 13 }}>
              Updated: {new Date().toLocaleTimeString()}
            </div>
          </div>

          <div style={{ height: 260, marginTop: 12 }}>
            {loading ? (
              <div style={{ color: "rgba(255,255,255,.72)", fontWeight: 800 }}>Loading chart...</div>
            ) : totalsAll.length ? (
              <Bar data={allChartData} options={chartOptsBar} />
            ) : (
              <div style={{ color: "rgba(255,255,255,.72)", fontWeight: 800 }}>No data yet.</div>
            )}
          </div>
        </div>

        <div className="cardGlass" style={{ padding: 18 }}>
          <h2 style={{ color: "#fff", margin: 0, fontSize: 22 }}>This Month Split</h2>
          <div style={{ height: 260, marginTop: 12 }}>
            {loading ? (
              <div style={{ color: "rgba(255,255,255,.72)", fontWeight: 800 }}>Loading chart...</div>
            ) : totalsMonth.length ? (
              <Doughnut data={monthChartData} options={chartOptsDoughnut} />
            ) : (
              <div style={{ color: "rgba(255,255,255,.72)", fontWeight: 800 }}>No data yet.</div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={panel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ color: "#fff", margin: 0, fontSize: 28 }}>Recent Activity</h2>
            <button onClick={fetchDashboard} style={ghostBtn}>
              Refresh
            </button>
          </div>

          <div style={{ marginTop: 14 }}>
            {(dash?.activities || []).length === 0 ? (
              <div style={{ color: "rgba(255,255,255,.72)", fontWeight: 700 }}>No activity yet.</div>
            ) : (
              (dash?.activities || []).map((a, idx) => (
                <div key={idx} style={activityRow}>
                  <div style={{ width: 10, height: 10, borderRadius: 999, background: "#38bdf8" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#fff", fontWeight: 900 }}>{a.message}</div>
                    <div style={{ color: "rgba(255,255,255,.62)", fontWeight: 700, fontSize: 13 }}>
                      {new Date(a.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        .cardGlass{
          background: rgba(20, 40, 55, 0.55);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 18px;
          padding: 18px;
          box-shadow: 0 20px 80px rgba(0,0,0,0.25);
        }
      `}</style>
    </div>
  );
}

function Card({ title, badge, children }) {
  return (
    <div className="cardGlass">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: "rgba(255,255,255,.8)", fontWeight: 900, letterSpacing: 0.6 }}>{title}</div>
        {badge ? (
          <div
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              background: "rgba(56,189,248,.18)",
              border: "1px solid rgba(56,189,248,.35)",
              color: "#38bdf8",
              fontWeight: 900,
              fontSize: 13,
            }}
          >
            {badge}
          </div>
        ) : null}
      </div>
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  );
}

function BigNumber({ children, style }) {
  return <div style={{ color: "#fff", fontSize: 52, fontWeight: 900, ...style }}>{children}</div>;
}

function SmallText({ children }) {
  return <div style={{ color: "rgba(255,255,255,.72)", fontWeight: 800, marginTop: 6 }}>{children}</div>;
}

function CurrencyPicker({ value, onChange }) {
  return (
    <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
      <div style={{ color: "rgba(255,255,255,.62)", fontWeight: 800 }}>Display currency:</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "rgba(0,0,0,0.25)",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 10,
          padding: "8px 10px",
          fontWeight: 800,
          outline: "none",
        }}
      >
        <option value="PKR">PKR</option>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
      </select>
    </div>
  );
}

const panel = {
  background: "rgba(20, 40, 55, 0.55)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 20px 80px rgba(0,0,0,0.25)",
};

const ghostBtn = {
  padding: "10px 16px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const activityRow = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  padding: "14px 12px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(0,0,0,0.12)",
  marginBottom: 10,
};
