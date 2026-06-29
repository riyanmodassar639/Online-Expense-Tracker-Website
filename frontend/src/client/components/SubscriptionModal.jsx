import { useState } from "react";
import api from "../../api/axios";

export default function SubscriptionModal({ open, onClose, userId }) {
  const [plan, setPlan] = useState("monthly");
  const [senderName, setSenderName] = useState("");
  const [senderAccount, setSenderAccount] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  // ✅ Your Company Account Info (admin account where user will transfer)
  const companyAccount = {
    bank: "Your Bank Name",
    accountName: "ExpenseTracker Pvt Ltd",
    accountNumber: "000000000000",
    iban: "PK00XXXX0000000000",
  };

  const submit = async () => {
    if (!userId) {
      alert("Please login/register first.");
      return;
    }
    if (!screenshot) {
      alert("Please upload payment screenshot");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("userId", userId);
      fd.append("plan", plan);
      fd.append("senderName", senderName);
      fd.append("senderAccount", senderAccount);
      fd.append("screenshot", screenshot);

      await api.post("/payments/submit", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Payment submitted ✅. Admin approval pending.");
      onClose();
    } catch (e) {
      alert(e?.response?.data?.message || "Payment submit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <h3 style={{ margin: 0 }}>Subscription Required</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <p style={{ opacity: 0.8, marginTop: 10 }}>
          Plan select karo, payment transfer karo, screenshot upload karo. Admin approve karega.
        </p>

        <div style={styles.plans}>
          {["monthly", "yearly", "2years"].map((p) => (
            <button
              key={p}
              onClick={() => setPlan(p)}
              style={{
                ...styles.planBtn,
                borderColor: plan === p ? "rgba(44,167,255,0.8)" : "rgba(255,255,255,0.16)",
              }}
            >
              {p === "monthly" ? "Monthly" : p === "yearly" ? "Yearly" : "2 Years"}
            </button>
          ))}
        </div>

        <div style={styles.box}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Pay to:</div>
          <div style={{ opacity: 0.85 }}>Bank: {companyAccount.bank}</div>
          <div style={{ opacity: 0.85 }}>Account Name: {companyAccount.accountName}</div>
          <div style={{ opacity: 0.85 }}>Account Number: {companyAccount.accountNumber}</div>
          <div style={{ opacity: 0.85 }}>IBAN: {companyAccount.iban}</div>
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <input
            style={styles.input}
            placeholder="Your Account Name"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
          />
          <input
            style={styles.input}
            placeholder="Your Account Number"
            value={senderAccount}
            onChange={(e) => setSenderAccount(e.target.value)}
          />

          <input
            style={styles.input}
            type="file"
            accept="image/*"
            onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
          />
        </div>

        <button disabled={loading} onClick={submit} style={styles.submitBtn}>
          {loading ? "Submitting..." : "Submit Payment"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "grid",
    placeItems: "center",
    padding: 16,
    zIndex: 999,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 18,
    padding: 18,
    background: "rgba(10,35,44,0.95)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#fff",
  },
  closeBtn: {
    border: "none",
    background: "rgba(255,255,255,0.10)",
    color: "#fff",
    borderRadius: 10,
    padding: "6px 10px",
    cursor: "pointer",
  },
  plans: { display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" },
  planBtn: {
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 800,
  },
  box: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    outline: "none",
  },
  submitBtn: {
    width: "100%",
    marginTop: 14,
    padding: "12px 14px",
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    fontWeight: 900,
    background: "rgba(44,167,255,0.95)",
    color: "#fff",
  },
};
