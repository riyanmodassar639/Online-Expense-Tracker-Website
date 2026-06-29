import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function Stats() {
  const [data, setData] = useState({
    approvedUsers: 0,
    totalExpenses: 0,
    totalPayments: 0,
  });

  const fetchStats = async () => {
    try {
      const res = await api.get("/public/stats");
      setData(res.data);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchStats();
    const t = setInterval(fetchStats, 5000);
    return () => clearInterval(t);
  }, []);

  const counters = [
    { label: "Users", value: data.approvedUsers },
    { label: "Expenses Tracked", value: data.totalExpenses },
    { label: "Payments (Rs)", value: data.totalPayments },
  ];

  return (
    <section className="stats-section">
      <div className="stats-grid">
        {counters.map((c, i) => (
          <Counter key={i} value={c.value} label={c.label} />
        ))}
      </div>
    </section>
  );
}

function Counter({ value, label }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Number(value) || 0;
    const step = Math.max(1, Math.floor(end / 60));

    const interval = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(interval);
      } else {
        setCount(start);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [value]);

  return (
    <div className="stat-box">
      <h2>{count}+</h2>
      <p>{label}</p>
    </div>
  );
}
