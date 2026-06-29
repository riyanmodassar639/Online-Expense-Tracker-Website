import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

// -------- helpers --------
function planLabel(planKey) {
  const p = String(planKey || "").toLowerCase();
  if (p === "monthly") return "Monthly";
  if (p === "yearly") return "Yearly";
  if (p === "two_years" || p === "2years" || p === "2year") return "2 Years";
  return planKey || "-";
}

export default function AdminPayments() {
  const [statusFilter, setStatusFilter] = useState("all"); // all|pending|approved|rejected
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  // Offers (we manage latest offer row)
  const [offers, setOffers] = useState([]);
  const [offerForm, setOfferForm] = useState({
    id: null,
    enabled: true,
    percentOff: 0,
    name: "",
    description: "",
    appliesTo: "all",
  });
  const [savingOffer, setSavingOffer] = useState(false);

  const fetchOffers = async () => {
    try {
      const r = await api.get("/admin/offers");
      const arr = Array.isArray(r.data) ? r.data : [];
      setOffers(arr);

      const latest = arr[0] || null;
      if (latest) {
        setOfferForm({
          id: latest.id,
          enabled: Number(latest.enabled) === 1,
          percentOff: Number(latest.percentOff || 0),
          name: latest.name || "",
          description: latest.description || "",
          appliesTo: latest.appliesTo || "all",
        });
      }
    } catch (e) {
      console.error("Fetch offers error:", e?.response?.data || e?.message);
    }
  };

  const fetchPayments = async () => {
    setErr("");
    try {
      const r = await api.get(`/admin/payments?status=${statusFilter}`);
      setRows(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load payments");
      console.error("Fetch payments error:", e?.response?.data || e?.message);
    }
  };

  useEffect(() => {
    fetchOffers();
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const imgSrc = (p) => {
    if (!p) return "";
    if (p.startsWith("http")) return p;
    if (p.startsWith("/uploads")) return `http://${window.location.hostname}:5000${p}`;
    return `http://${window.location.hostname}:5000/uploads/${p}`;
  };

  const approve = async (id, plan) => {
    try {
      await api.put(`/admin/payments/${id}/approve`, { plan });
      await fetchPayments();
      alert("Approved");
    } catch (e) {
      alert(e?.response?.data?.message || "Action failed");
      console.error(e?.response?.data || e?.message);
    }
  };

  const reject = async (id) => {
    try {
      await api.put(`/admin/payments/${id}/reject`);
      await fetchPayments();
      alert("Rejected");
    } catch (e) {
      alert(e?.response?.data?.message || "Action failed");
      console.error(e?.response?.data || e?.message);
    }
  };

  const saveOffer = async () => {
    try {
      setSavingOffer(true);
      setErr("");

      const payload = {
        enabled: offerForm.enabled ? 1 : 0,
        percentOff: Number(offerForm.percentOff || 0),
        name: offerForm.name,
        description: offerForm.description,
        appliesTo: offerForm.appliesTo || "all",
        startsAt: null,
        endsAt: null,
      };

      if (offerForm.id) {
        await api.put(`/admin/offers/${offerForm.id}`, payload);
      } else {
        const r = await api.post(`/admin/offers`, payload);
        if (r?.data?.id) payload.id = r.data.id;
      }

      alert("Offer saved");
      await fetchOffers();
    } catch (e) {
      alert(e?.response?.data?.message || "Offer save failed");
      console.error(e?.response?.data || e?.message);
    } finally {
      setSavingOffer(false);
    }
  };

  // ✅ FIX: status badge + text (Approved should not show Pending)
  const statusMeta = useMemo(() => {
    return (p) => {
      const raw = String(p?.status || "").trim().toLowerCase();

      const isApproved = raw.includes("approved");
      const isRejected = raw.includes("rejected");

      if (isApproved) {
        return { cls: "approved", text: `${planLabel(p?.plan)} Approved` };
      }
      if (isRejected) {
        return { cls: "rejected", text: "Rejected" };
      }
      return { cls: "pending", text: "Pending" };
    };
  }, []);

  return (
    <div className="page-wrap">
      <div className="card big">
        <div className="topRow">
          <div>
            <h1>Payments</h1>
            <p className="sub">Verification, approval, and discount offers.</p>
          </div>

          <div className="rightTop">
            <select
              className="pillSelect"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <button className="btnWhite" onClick={fetchPayments}>
              Refresh
            </button>
          </div>
        </div>

        {/* Offer control (matches offers table) */}
        <div className="offerBox">
          <div className="offerLeft">
            <div className="row">
              <label className="chk">
                <input
                  type="checkbox"
                  checked={offerForm.enabled}
                  onChange={(e) => setOfferForm((o) => ({ ...o, enabled: e.target.checked }))}
                />
                Enable Offer
              </label>

              <div className="inline">
                <span className="mini">Percent Off</span>
                <input
                  className="inp"
                  type="number"
                  min="0"
                  max="90"
                  value={offerForm.percentOff}
                  onChange={(e) =>
                    setOfferForm((o) => ({ ...o, percentOff: Number(e.target.value || 0) }))
                  }
                />
              </div>

              <div className="inline">
                <span className="mini">Applies To</span>
                <select
                  className="inp"
                  value={offerForm.appliesTo}
                  onChange={(e) => setOfferForm((o) => ({ ...o, appliesTo: e.target.value }))}
                >
                  <option value="all">All</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="two_years">2 Years</option>
                </select>
              </div>
            </div>

            <div className="row">
              <input
                className="inp wide"
                placeholder="Offer title (e.g., RAMADAN MUBARAK!)"
                value={offerForm.name}
                onChange={(e) => setOfferForm((o) => ({ ...o, name: e.target.value }))}
              />
            </div>

            <div className="row">
              <textarea
                className="inp wide"
                rows={2}
                placeholder="Offer message (e.g., Enjoy 20% off in Ramadan.)"
                value={offerForm.description}
                onChange={(e) => setOfferForm((o) => ({ ...o, description: e.target.value }))}
              />
            </div>
          </div>

          <div className="offerRight">
            <button className="btnBlue" disabled={savingOffer} onClick={saveOffer}>
              {savingOffer ? "Saving..." : "Save Offer"}
            </button>
          </div>
        </div>

        {err ? <div className="err">{err}</div> : null}

        <div className="tableWrap">
          <div className="thead">
            <div>ID</div>
            <div>User</div>
            <div>Requested Plan</div>
            <div>Amount</div>
            <div>Sender</div>
            <div>Screenshot</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {rows.length === 0 ? (
            <div className="empty">No payments found.</div>
          ) : (
            rows.map((p) => {
              const sm = statusMeta(p);

              return (
                <div className="trow" key={p.id}>
                  <div className="mono">{p.id}</div>

                  <div className="userCell">
                    <img
                      className="avatar"
                      src={
                        p.profilePic
                          ? imgSrc(
                              p.profilePic.startsWith("/uploads")
                                ? p.profilePic
                                : `/uploads/profiles/${p.profilePic}`
                            )
                          : "https://via.placeholder.com/40"
                      }
                      alt="profile"
                    />
                    <div className="uMeta">
                      <div className="uName">{p.username || `User #${p.userId}`}</div>
                      <div className="uSmall">ID: {p.userId}</div>
                    </div>
                  </div>

                  <div className="cap">{planLabel(p.plan)}</div>

                  <div className="amt">
                    {p.currency} {p.amount}
                  </div>

                  <div className="sender">
                    <div>Name: {p.senderName || "-"}</div>
                    <div>Account: {p.senderAccount || "-"}</div>
                  </div>

                  <div>
                    {p.screenshot ? (
                      <a className="link" href={imgSrc(p.screenshot)} target="_blank" rel="noreferrer">
                        View Screenshot
                      </a>
                    ) : (
                      "-"
                    )}
                  </div>

                  {/* ✅ fixed status */}
                  <div className={`badge ${sm.cls}`}>{sm.text}</div>

                  <div className="actions">
                    <button className="btnGreen sm" onClick={() => approve(p.id, "monthly")}>
                      Monthly
                    </button>
                    <button className="btnGreen sm" onClick={() => approve(p.id, "yearly")}>
                      Yearly
                    </button>
                    <button className="btnGreen sm" onClick={() => approve(p.id, "2years")}>
                      2 Years
                    </button>
                    <button className="btnRed sm" onClick={() => reject(p.id)}>
                      Reject
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        .page-wrap{ padding: 28px 40px; }
        .card.big{
          border-radius: 26px;
          padding: 26px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 18px 60px rgba(0,0,0,.35);
        }
        h1{ margin:0; font-size: 52px; letter-spacing: .5px; }
        .sub{ margin: 4px 0 0; opacity: .8; font-weight: 700; }
        .topRow{ display:flex; align-items:flex-start; justify-content:space-between; gap: 20px; }
        .rightTop{ display:flex; align-items:center; gap: 14px; }

        .pillSelect{
          padding: 12px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(0,0,0,0.18);
          color: #fff;
          font-weight: 800;
          outline:none;
        }
        .btnWhite{ padding: 14px 22px; border-radius: 999px; border: none; font-weight: 900; cursor:pointer; }

        .offerBox{
          margin-top: 18px;
          padding: 16px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(0,0,0,0.14);
          display:flex;
          justify-content:space-between;
          gap: 16px;
        }
        .offerLeft{ flex: 1; display:flex; flex-direction:column; gap: 10px;}
        .offerRight{ display:flex; align-items:flex-start; }
        .row{ display:flex; gap: 12px; align-items:center; flex-wrap:wrap; }
        .chk{ font-weight: 900; display:flex; gap: 10px; align-items:center; }
        .inline{ display:flex; gap: 10px; align-items:center; }
        .mini{ opacity:.85; font-weight: 800; }
        .inp{
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(0,0,0,0.18);
          color: #fff;
          outline:none;
          font-weight: 800;
        }
        .inp.wide{ width: min(720px, 100%); }
        .btnBlue{ padding: 14px 18px; border-radius: 999px; border: none; font-weight: 900; background: #38bdf8; cursor:pointer; }

        .err{ margin-top: 14px; color: #ffb4b4; font-weight: 900; }

        .tableWrap{ margin-top: 18px; overflow:auto; border-radius: 18px; }
        .thead, .trow{
          display:grid;
          grid-template-columns: 70px 260px 140px 140px 220px 140px 160px 420px;
          gap: 14px;
          align-items:center;
          min-width: 1280px;
        }
        .thead{ padding: 14px; font-weight: 900; opacity: .9; border-bottom: 1px solid rgba(255,255,255,0.10); }
        .trow{ padding: 14px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .empty{ padding: 18px; opacity:.8; font-weight: 800; }

        .mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono"; font-weight: 900; }
        .userCell{ display:flex; gap: 12px; align-items:center; }
        .avatar{ width: 44px; height: 44px; border-radius: 999px; object-fit: cover; border: 2px solid rgba(255,255,255,0.25); }
        .uMeta{ display:flex; flex-direction:column; gap: 2px; }
        .uName{ font-weight: 900; }
        .uSmall{ opacity: .7; font-weight: 800; font-size: 12px; }

        .cap{ font-weight: 900; text-transform: uppercase; }
        .amt{ font-weight: 900; color:#38bdf8; }
        .sender{ opacity: .9; font-weight: 800; }
        .link{ font-weight: 900; color:#38bdf8; text-decoration:none; }

        .badge{
          padding: 10px 14px;
          border-radius: 999px;
          display:inline-flex;
          justify-content:center;
          font-weight: 900;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(0,0,0,0.18);
          width: fit-content;
        }
        .badge.pending{ color:#ffd38a; }
        .badge.approved{ color:#8bffb1; }
        .badge.rejected{ color:#ff9a9a; }

        .actions{ display:flex; gap: 10px; flex-wrap:wrap; justify-content:flex-end; }
        .sm{ padding: 10px 14px; border-radius: 999px; border:none; font-weight: 900; cursor:pointer; }
        .btnGreen{ background:#22c55e; color:#071018; }
        .btnRed{ background:#ef4444; color:#fff; }
      `}</style>
    </div>
  );
}
