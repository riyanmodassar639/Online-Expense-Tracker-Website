export default function Stats() {
  return (
    <section className="section stats-section">
      <h2 className="section-title">Statistics</h2>
      <p className="section-sub">Numbers that reflect system activity</p>

      <div className="stats-container">
        <div className="stat-box animate-box">
          <h2>150</h2>
          <p>Users</p>
        </div>

        <div className="stat-box animate-box">
          <h2>5000</h2>
          <p>Expenses Recorded</p>
        </div>

        <div className="stat-box animate-box">
          <h2>1200</h2>
          <p>Reports Generated</p>
        </div>
      </div>
    </section>
  );
}
