export default function ContactUs() {
  return (
    <section className="section contact-section" id="contact">
      <h2 className="section-title">Contact Us</h2>
      <p className="section-sub">
        We're always here to support your financial journey
      </p>

      <div className="contact-grid">
        <div className="contact-box animate-box">
          <h3>Get in Touch</h3>
          <p>Email: expensetracker76@gmail.com</p>
          <p>Phone: +92 347 0758060</p>
          <p>Available 24/7 for assistance</p>
        </div>

        <div className="contact-box animate-box">
          <h3>Quick Support</h3>
          <p style={{marginBottom: "16px"}}>
            Need instant help? Chat with us directly on WhatsApp for fast response.
          </p>
          <button className="primary-btn oval-green">Chat on WhatsApp</button>
        </div>
      </div>
    </section>
  );
}
