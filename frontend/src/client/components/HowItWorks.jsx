export default function HowItWorks() {
  const steps = [
    {
      n: "1",
      title: "Create Account",
      desc: "Sign up and setup your basic details",
    },
    {
      n: "2",
      title: "Add Expenses",
      desc: "Save daily expenses in seconds",
    },
    {
      n: "3",
      title: "Track & Analyze",
      desc: "View reports and manage your spending",
    },
  ];

  return (
    <section className="how-section" id="how">
      <h2 className="section-title">How It Works</h2>


      <div
        style={{
          maxWidth: 1100,
          margin: "28px auto 0",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 22,
          padding: "0 10px",
        }}
      >
        {steps.map((s) => (
          <div
            key={s.n}
            className="how-box"
            style={{
              padding: 26,
              textAlign: "center",
              transition: "0.25s ease",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                display: "grid",
                placeItems: "center",
                margin: "0 auto 14px",
                background: "rgba(56,189,248,0.18)",
                border: "1px solid rgba(56,189,248,0.22)",
                fontWeight: 900,
                color: "#38bdf8",
              }}
            >
              {s.n}
            </div>

            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>
              {s.title}
            </div>
            <div style={{ opacity: 0.78, fontWeight: 650, lineHeight: 1.6 }}>
              {s.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Responsive */}
      <style>{`
        @media (max-width: 900px) {
          .how-section > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
