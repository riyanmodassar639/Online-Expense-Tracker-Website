import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

const PLANS = [
  { key: "monthly", title: "Monthly", subtitle: "Best for starters" },
  { key: "yearly", title: "Yearly", subtitle: "Save more yearly" },
  { key: "two_years", title: "2 Years", subtitle: "Best long-term value" },
];

const BASE = {
  PKR: { monthly: 100, yearly: 1000, two_years: 2000 },
  USD: { monthly: 1, yearly: 10, two_years: 20 },
  EUR: { monthly: 1, yearly: 10, two_years: 20 },
};

function money(currency, amount) {
  if (currency === "PKR") return `PKR ${amount}`;
  return `${currency} ${amount}`;
}

function applyOffer(amount, percent) {
  const p = Number(percent || 0);
  if (!p || p <= 0) return amount;
  const v = amount - (amount * p) / 100;
  return Math.round(v * 100) / 100;
}

export default function SubscriptionPricingModal({
  open,
  onClose,
  onSelectPlan,
  defaultCurrency = "PKR",
}) {
  const [currency, setCurrency] = useState(defaultCurrency);
  const [offers, setOffers] = useState([]);
  const [loadingOffer, setLoadingOffer] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingOffer(true);
    api
      .get("/offers/active")
      .then((r) => setOffers(r.data || []))
      .catch(() => setOffers([]))
      .finally(() => setLoadingOffer(false));
  }, [open]);

  const activeOffer = useMemo(() => {
    // take latest offer (backend already returns latest first, but safe)
    return (offers || [])[0] || null;
  }, [offers]);

  function offerForPlan(planKey) {
    if (!activeOffer) return null;
    const appliesTo = String(activeOffer.appliesTo || "all").toLowerCase();
    if (appliesTo !== "all" && appliesTo !== planKey) return null;
    const percent = Number(activeOffer.percentOff || 0);
    if (!percent || percent <= 0) return null;
    return { ...activeOffer, percentOff: percent };
  }

  if (!open) return null;

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <div style={styles.head}>
          <div>
            <div style={styles.title}>Pricing</div>
            <div style={styles.sub}>
              Choose a plan to unlock expenses.{" "}
              {loadingOffer ? "(Checking offers...)" : ""}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              style={styles.select}
            >
              <option value="PKR">PKR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>

            <button onClick={onClose} style={styles.closeBtn}>
              ✕
            </button>
          </div>
        </div>

        {activeOffer && Number(activeOffer.percentOff || 0) > 0 && (
          <div style={styles.offerBanner}>
            <div style={{ fontWeight: 800 }}>
              {activeOffer.name || "Special Offer"}
            </div>
            <div style={{ opacity: 0.9 }}>
              {activeOffer.description || `Enjoy ${activeOffer.percentOff}% off`}
            </div>
          </div>
        )}

        <div style={styles.grid}>
          {PLANS.map((p) => {
            const base = BASE[currency][p.key];
            const off = offerForPlan(p.key);
            const discounted = off ? applyOffer(base, off.percentOff) : base;

            return (
              <div key={p.key} style={styles.card}>
                <div style={styles.cardTop}>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{p.title}</div>
                  {off ? (
                    <div style={styles.badge}>{off.percentOff}% OFF</div>
                  ) : (
                    <div style={styles.badgeGhost}>No offer</div>
                  )}
                </div>

                <div style={{ color: "rgba(255,255,255,0.78)", marginTop: 4 }}>
                  {p.subtitle}
                </div>

                <div style={{ marginTop: 16 }}>
                  {off ? (
                    <div style={{ display: "flex", gap: 10, alignItems: "end" }}>
                      <div style={styles.price}>{money(currency, discounted)}</div>
                      <div style={styles.oldPrice}>{money(currency, base)}</div>
                    </div>
                  ) : (
                    <div style={styles.price}>{money(currency, base)}</div>
                  )}
                </div>

                <ul style={styles.ul}>
                  <li>Unlimited expenses</li>
                  <li>Export Excel/PDF</li>
                  <li>Receipts upload</li>
                  <li>Dashboard totals + activity</li>
                </ul>

                <button
                  style={styles.primary}
                  onClick={() =>
                    onSelectPlan({
                      plan: p.key,
                      currency,
                      baseAmount: base,
                      finalAmount: discounted,
                      offer: off,
                    })
                  }
                >
                  Select Plan
                </button>
              </div>
            );
          })}
        </div>

        <div style={styles.footerNote}>
          By submitting payment, admin will verify and activate your plan.
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    zIndex: 9999,
  },
  modal: {
    width: "min(980px, 96vw)",
    maxHeight: "92vh",
    overflow: "auto",
    borderRadius: 18,
    background: "linear-gradient(180deg, rgba(18,40,50,0.98), rgba(10,22,28,0.98))",
    border: "1px solid rgba(255,255,255,0.10)",
    padding: 16,
    color: "#fff",
  },
  head: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  title: { fontSize: 28, fontWeight: 900 },
  sub: { opacity: 0.8, marginTop: 2 },
  closeBtn: {
    height: 36,
    width: 36,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    cursor: "pointer",
  },
  select: {
    height: 36,
    borderRadius: 10,
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.12)",
    padding: "0 10px",
    outline: "none",
  },
  offerBanner: {
    marginTop: 10,
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,180,255,0.10)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 14,
    marginTop: 10,
  },
  card: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    padding: 14,
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  badge: {
    fontSize: 12,
    fontWeight: 900,
    background: "rgba(0,255,140,0.16)",
    border: "1px solid rgba(0,255,140,0.25)",
    padding: "4px 8px",
    borderRadius: 999,
  },
  badgeGhost: {
    fontSize: 12,
    fontWeight: 800,
    opacity: 0.6,
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
  },
  price: { fontSize: 28, fontWeight: 900 },
  oldPrice: { textDecoration: "line-through", opacity: 0.65, marginBottom: 4 },
  ul: {
    marginTop: 12,
    paddingLeft: 18,
    opacity: 0.9,
    lineHeight: 1.8,
  },
  primary: {
    width: "100%",
    height: 42,
    borderRadius: 12,
    border: "none",
    background: "rgba(0,160,255,0.95)",
    color: "#001018",
    fontWeight: 900,
    cursor: "pointer",
    marginTop: 10,
  },
  footerNote: {
    marginTop: 12,
    opacity: 0.75,
    fontSize: 13,
  },
};
