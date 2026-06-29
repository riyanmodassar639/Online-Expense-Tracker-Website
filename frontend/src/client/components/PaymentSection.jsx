export default function PaymentSection() {
  return (
    <section className="section payment-section" id="payments">
      <h2 className="section-title">Payment Methods</h2>
      <p className="section-sub">
        Secure & trusted payment options
      </p>

      <div className="payment-grid">
        <div className="payment-box animate-box">
          <h3>Payment Information</h3>
          <p>
            Account activation requires one-time payment.
            Once approved by admin, your account becomes active.
          </p>
        </div>

        <div className="payment-box animate-box">
          <h3>Available Methods</h3>
          <ul>
            <li>✔ JazzCash</li>
            <li>✔ Easypaisa</li>
            <li>✔ UBL Bank Transfer</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
