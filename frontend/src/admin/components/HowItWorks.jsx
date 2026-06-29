export default function HowItWorks() {
  return (
    <section className="how-section" id="how">
      <h2 className="section-title">How Admin Panel Works</h2>

      <div className="how-grid">
        <div className="how-card animate-box">
          <span className="step-number">1</span>
          <h3>Manage Users</h3>
          <p>Approve, edit, or remove users</p>
        </div>

        <div className="how-card animate-box">
          <span className="step-number">2</span>
          <h3>Track Expenses</h3>
          <p>Monitor daily and monthly expenses</p>
        </div>

        <div className="how-card animate-box">
          <span className="step-number">3</span>
          <h3>Generate Reports</h3>
          <p>Create detailed monthly analytics</p>
        </div>
      </div>
    </section>
  );
}
