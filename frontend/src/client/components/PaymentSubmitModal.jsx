import { useState } from "react";
import api from "../../api/axios";

export default function PaymentSubmitModal({ open, onClose, selection, onSubmitted }) {
  const [senderName, setSenderName] = useState("");
  const [senderAccount, setSenderAccount] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const { plan, currency, finalAmount, offer } = selection || {};

  const accountName = "YOUR ACCOUNT NAME";
  const accountNumber = "1234567890";

  async function submit() {
    if (!senderName.trim()) return alert("Sender name is required");
    if (!senderAccount.trim()) return alert("Account / Transaction Ref is required");
    if (!file) return alert("Screenshot is required");

    const fd = new FormData();
    fd.append("plan", plan);
    fd.append("currency", currency);
    fd.append("senderName", senderName.trim());
    fd.append("senderAccount", senderAccount.trim());
    fd.append("screenshot", file);

    setBusy(true);
    try {
      const res = await api.post("/payments/submit", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Payment submitted. Admin will verify.");
      onSubmitted?.(res.data);
      onClose();
    } catch (e) {
      alert(e?.response?.data?.message || "Payment submit failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <div style={styles.head}>
          <div>
            <div style={styles.title}>Submit Payment</div>
            <div style={styles.sub}>
              Plan: <b>{String(plan || "").toUpperCase()}</b> — Amount:{" "}
              <b>
                {currency} {finalAmount}
              </b>
            </div>
            {offer?.name && (
              <div style={{ marginTop: 6, opacity: 0.9 }}>
                Offer Applied: <b>{offer.name}</b> ({offer.percentOff}% OFF)
              </div>
            )}
          </div>

          <button onClick={onClose} style={styles.closeBtn}>
            ✕
          </button>
        </div>

        <div style={styles.box}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Send payment to:</div>
          <div style={{ opacity: 0.9 }}>Name: <b>{accountName}</b></div>
          <div style={{ opacity: 0.9 }}>Account: <b>{accountNumber}</b></div>
          <div style={{ opacity: 0.8, marginTop: 8 }}>
            After sending, fill details below and upload screenshot.
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Sender Name</label>
            <input
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              style={styles.input}
              placeholder="e.g. Ali"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Sender Account / Transaction Ref</label>
            <input
              value={senderAccount}
              onChange={(e) => setSenderAccount(e.target.value)}
              style={styles.input}
              placeholder="e.g. 12345678"
            />
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Payment Screenshot *</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={styles.file}
          />
          {file?.name && <div style={{ opacity: 0.85, marginTop: 6 }}>Selected: {file.name}</div>}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
          <button onClick={onClose} style={styles.btnGhost} disabled={busy}>
            Back
          </button>
          <button onClick={submit} style={styles.btnPrimary} disabled={busy}>
            {busy ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.60)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    zIndex: 9999,
  },
  modal: {
    width: "min(860px, 96vw)",
    maxHeight: "92vh",
    overflow: "auto",
    borderRadius: 18,
    background: "linear-gradient(180deg, rgba(18,40,50,0.98), rgba(10,22,28,0.98))",
    border: "1px solid rgba(255,255,255,0.10)",
    padding: 16,
    color: "#fff",
  },
  head: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" },
  title: { fontSize: 26, fontWeight: 900 },
  sub: { opacity: 0.8, marginTop: 4 },
  closeBtn: {
    height: 36,
    width: 36,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    cursor: "pointer",
  },
  box: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
  },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 },
  field: { display: "flex", flexDirection: "column", gap: 6, marginTop: 10 },
  label: { fontSize: 13, opacity: 0.85, fontWeight: 700 },
  input: {
    height: 42,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    outline: "none",
    padding: "0 12px",
  },
  file: {
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    padding: 10,
    color: "#fff",
  },
  btnGhost: {
    height: 42,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    padding: "0 16px",
    cursor: "pointer",
  },
  btnPrimary: {
    height: 42,
    borderRadius: 12,
    border: "none",
    background: "rgba(0,160,255,0.95)",
    color: "#001018",
    fontWeight: 900,
    padding: "0 16px",
    cursor: "pointer",
  },
};
