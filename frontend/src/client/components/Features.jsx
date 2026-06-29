export default function Features() {
  const items = [
    {
      title: "Add Expense",
      desc: "Track daily & monthly expenses easily",
    },
    {
      title: "Monthly Reports",
      desc: "Analyze trends with monthly summaries",
    },
    {
      title: "Export PDF / Excel",
      desc: "Download your expense reports anytime",
    },
  ];

  return (
    <section className="features-section">
      <h2 className="section-title">Powerful Features</h2>

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
        {items.map((f) => (
          <div
            key={f.title}
            className="feature-box"
            style={{
              padding: 26,
              textAlign: "left",
              transition: "0.25s ease",
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                marginBottom: 8,
                color: "rgba(255,255,255,0.92)",
              }}
            >
              {f.title}
            </div>
            <div style={{ opacity: 0.78, fontWeight: 650, lineHeight: 1.6 }}>
              {f.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Responsive */}
      <style>{`
        @media (max-width: 900px) {
          .features-section > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
