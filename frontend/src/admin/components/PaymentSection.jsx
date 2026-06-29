export default function PaymentSection() {
  return (
    <section className="section payment-section" id="payments">
      <h2 className="section-title">Monthly Reports</h2>
      <p className="section-sub">
        View and download expense reports of all users
      </p>

      <div className="payment-grid">
        <div className="payment-box animate-box">
          <h3>Pending Approvals</h3>
          <p>Check users pending expense approvals</p>
        </div>

        <div className="payment-box animate-box">
          <h3>Completed Reports</h3>
          <p>Review all completed monthly reports</p>
        </div>
      </div>
    </section>
  );
}
