import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  PointElement,
  LineElement,
} from "chart.js";
import { Pie, Doughnut, Bar, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  PointElement,
  LineElement
);

// ---------------- helpers ----------------
const API_BASE =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
const FILE_BASE = API_BASE.replace(/\/api\/?$/, "");

function clsx(...arr) {
  return arr.filter(Boolean).join(" ");
}

function fmtMoney(currency, amount) {
  const n = Number(amount || 0);
  if (currency === "PKR") return `PKR ${n.toLocaleString()}`;
  if (currency === "USD") return `$${n.toLocaleString()}`;
  if (currency === "EUR") return `€${n.toLocaleString()}`;
  return `${currency} ${n.toLocaleString()}`;
}

function planLabel(planKey) {
  const p = String(planKey || "").toLowerCase();
  if (p === "monthly") return "Monthly";
  if (p === "yearly") return "Yearly";
  if (p === "two_years" || p === "2years" || p === "2year") return "2 Years";
  if (p === "free" || p === "none" || !p) return "Free";
  return planKey || "-";
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

async function downloadViaApi(urlPath, filename) {
  const res = await api.get(urlPath, { responseType: "blob" });
  downloadBlob(res.data, filename);
}

function pad2(n) {
  return String(n).padStart(2, "0");
}
function nowDate() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function nowTime() {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function safeJsonParse(v, fallback) {
  try {
    if (v === null || v === undefined || v === "") return fallback;
    if (typeof v === "object") return v;
    return JSON.parse(String(v));
  } catch {
    return fallback;
  }
}

// ---------------- categories + subcategories ----------------
const CATEGORY_TREE = {
  general: {
    Food: {
      Fruits: ["Apple", "Banana", "Orange", "Mango"],
      Vegetables: ["Potato", "Tomato", "Onion", "Carrot"],
      Meat: ["Chicken", "Beef", "Mutton", "Fish"],
      Other: ["Other"],
    },
    Transport: {
      Bus: ["Bus"],
      Car: ["Fuel", "Maintenance", "Parking"],
      Bike: ["Fuel", "Maintenance"],
      Ride: ["Uber", "Careem", "Taxi"],
      Other: ["Other"],
    },
    Bills: {
      Electricity: ["Electricity"],
      Gas: ["Gas"],
      Water: ["Water"],
      Internet: ["Internet"],
      Other: ["Other"],
    },
    Shopping: {
      Clothes: ["Clothes"],
      Electronics: ["Electronics"],
      Home: ["Home"],
      Other: ["Other"],
    },
    Health: {
      Medicines: ["Medicines"],
      Doctor: ["Doctor"],
      Tests: ["Tests"],
      Other: ["Other"],
    },
    Education: {
      Fees: ["Fees"],
      Books: ["Books"],
      Courses: ["Courses"],
      Other: ["Other"],
    },
    Rent: {
      House: ["House Rent"],
      Office: ["Office Rent"],
      Other: ["Other"],
    },
    Entertainment: {
      Movies: ["Movies"],
      Games: ["Games"],
      Outing: ["Outing"],
      Other: ["Other"],
    },
    Gifts: {
      Family: ["Family"],
      Friends: ["Friends"],
      Other: ["Other"],
    },
    Travel: {
      Tickets: ["Tickets"],
      Hotel: ["Hotel"],
      Food: ["Food"],
      Other: ["Other"],
    },
    Other: { Other: ["Other"] },
  },
  muslim: {
    Zakat: { Zakat: ["Zakat"] },
    Sadaqah: { Sadaqah: ["Sadaqah"] },
    Ramadan: { Ramadan: ["Iftar", "Sehri", "Charity"] },
    Eid: { Eid: ["Clothes", "Gifts", "Food"] },
    "Hajj/Umrah": { "Hajj/Umrah": ["Tickets", "Hotel", "Food", "Other"] },
    Charity: { Charity: ["Poor", "Masjid", "Orphans", "Other"] },
    Masjid: { Masjid: ["Donation", "Other"] },
    Qurbani: { Qurbani: ["Cow", "Goat", "Other"] },
    "Eid Greetings": { "Eid Greetings": ["Cards", "Gifts", "Other"] },
    Other: { Other: ["Other"] },
  },
};

const DEFAULT_CATEGORIES = {
  general: Object.keys(CATEGORY_TREE.general),
  muslim: Object.keys(CATEGORY_TREE.muslim),
};

// ---------------- pricing config ----------------
const PLANS = [
  {
    key: "monthly",
    name: "Monthly",
    badge: "Most Popular",
    prices: { PKR: 100, USD: 1, EUR: 1 },
    features: [
      "Add unlimited expenses",
      "Edit / delete expenses",
      "Export PDF & Excel",
      "Receipt upload",
      "Dashboard totals + activity",
    ],
  },
  {
    key: "yearly",
    name: "Yearly",
    badge: "Best Value",
    prices: { PKR: 1000, USD: 10, EUR: 10 },
    features: [
      "Everything in Monthly",
      "Long validity",
      "Fewer renewals",
      "Priority verification",
      "More savings over time",
    ],
  },
  {
    key: "two_years",
    name: "2 Years",
    badge: "Max Savings",
    prices: { PKR: 2000, USD: 20, EUR: 20 },
    features: [
      "Everything in Yearly",
      "Longest validity",
      "Maximum savings",
      "Fewer renewals",
      "Peace of mind",
    ],
  },
];

function computeDiscountedPrice(original, discountPercent) {
  const p = Number(discountPercent || 0);
  if (!p || p <= 0) return original;
  return original - original * (p / 100);
}

// ---------------- Modal: Subscription Plans ----------------
function SubscriptionPlansModal({
  open,
  onClose,
  onChoosePlan,
  offer,
  defaultCurrency = "PKR",
}) {
  const [currency, setCurrency] = useState(defaultCurrency);

  useEffect(() => {
    if (open) setCurrency(defaultCurrency);
  }, [open, defaultCurrency]);

  if (!open) return null;
  const offerActive = !!offer?.active && Number(offer?.discountPercent || 0) > 0;

  return (
    <div className="et-modalOverlay" role="dialog" aria-modal="true">
      <div className="et-modal et-modalWide">
        <div className="et-modalHeader">
          <div>
            <h2 className="et-title">Choose a Subscription</h2>
            <p className="et-subtitle">
              Expenses can be added only with an active subscription.
            </p>
          </div>
          <button className="et-iconBtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="et-modalBody et-scroll">
          {offerActive && (
            <div className="et-offerBanner">
              <div className="et-offerTag">{offer?.title || "Limited Offer"}</div>
              <div className="et-offerText">
                <strong>{offer?.message || "Enjoy a discount!"}</strong>
                <span className="et-offerPercent">
                  {offer.discountPercent}% OFF
                </span>
              </div>
            </div>
          )}

          <div className="et-row et-rowBetween et-rowWrap">
            <div className="et-hint">
              Currency for pricing: <span className="et-pill">{currency}</span>
            </div>
            <div className="et-inline">
              <label className="et-labelSmall">Currency</label>
              <select
                className="et-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="PKR">PKR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div className="et-planGrid">
            {PLANS.map((p) => {
              const original = p.prices[currency];
              const discounted = offerActive
                ? computeDiscountedPrice(original, offer.discountPercent)
                : original;

              const showDiscount = offerActive && discounted !== original;

              return (
                <div key={p.key} className="et-planCard">
                  <div className="et-planTop">
                    <div className="et-planName">{p.name}</div>
                    <div className="et-badge">{p.badge}</div>
                  </div>

                  <div className="et-priceBox">
                    {showDiscount ? (
                      <div className="et-priceLine">
                        <span className="et-priceOld">
                          {fmtMoney(currency, original)}
                        </span>
                        <span className="et-priceNew">
                          {fmtMoney(currency, discounted)}
                        </span>
                      </div>
                    ) : (
                      <div className="et-priceNew">{fmtMoney(currency, original)}</div>
                    )}
                    <div className="et-priceSub">
                      Billed as {p.name.toLowerCase()}
                    </div>
                  </div>

                  <ul className="et-featureList">
                    {p.features.map((f, i) => (
                      <li key={i} className="et-featureItem">
                        <span className="et-check">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    className="et-btnPrimary et-btnFull"
                    onClick={() =>
                      onChoosePlan({
                        plan: p.key,
                        currency,
                        originalAmount: original,
                        amount: discounted,
                        offer: offerActive ? offer : null,
                      })
                    }
                  >
                    Choose {p.name}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="et-note">
            After you submit payment, the admin will verify and approve your subscription.
          </div>
        </div>

        <div className="et-modalFooter">
          <button className="et-btnGhost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- Modal: Submit Payment ----------------
function SubmitPaymentModal({ open, onClose, selection, onSubmitted }) {
  const [senderName, setSenderName] = useState("");
  const [senderAccount, setSenderAccount] = useState("");
  const [shot, setShot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const RECEIVER_NAME = "ExpenseTracker Official";
  const RECEIVER_ACCOUNT = "0312-1234567";
  const PAYMENT_METHOD = "Bank Transfer / Easypaisa / JazzCash";

  useEffect(() => {
    if (open) {
      setSenderName("");
      setSenderAccount("");
      setShot(null);
      setLoading(false);
      setErr("");
    }
  }, [open]);

  if (!open) return null;

  const plan = selection?.plan;
  const currency = selection?.currency;
  const amount = selection?.amount;

  async function submitPayment() {
    try {
      setErr("");
      if (!senderName.trim()) return setErr("Sender name is required.");
      if (!senderAccount.trim())
        return setErr("Transaction ref / account is required.");
      if (!shot) return setErr("Payment screenshot is required.");

      setLoading(true);

      const fd = new FormData();
      fd.append("plan", plan);
      fd.append("currency", currency);
      fd.append("amount", String(amount));
      fd.append("senderName", senderName.trim());
      fd.append("senderAccount", senderAccount.trim());
      fd.append("screenshot", shot);

      const res = await api.post("/payments/submit", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!res?.data?.success)
        throw new Error(res?.data?.message || "Payment submit failed");

      onSubmitted?.(res.data);
      onClose();
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Submit failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="et-modalOverlay" role="dialog" aria-modal="true">
      <div className="et-modal">
        <div className="et-modalHeader">
          <div>
            <h2 className="et-title">Submit Payment</h2>
            <p className="et-subtitle">
              Plan: <strong>{planLabel(plan)}</strong> — Amount:{" "}
              <strong>{fmtMoney(currency, amount)}</strong>
            </p>
          </div>

          <button className="et-iconBtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="et-modalBody et-scroll">
          <div className="et-payInfo">
            <div className="et-payRow">
              <div className="et-payLabel">Send payment to</div>
              <div className="et-payValue">{RECEIVER_NAME}</div>
            </div>
            <div className="et-payRow">
              <div className="et-payLabel">Account / Wallet</div>
              <div className="et-payValue">{RECEIVER_ACCOUNT}</div>
            </div>
            <div className="et-payRow">
              <div className="et-payLabel">Method</div>
              <div className="et-payValue">{PAYMENT_METHOD}</div>
            </div>
            <div className="et-payHint">
              Send the exact amount and upload the screenshot below.
            </div>
          </div>

          <div className="et-grid2">
            <div className="et-field">
              <label className="et-label">Sender Name *</label>
              <input
                className="et-input"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. Ali Ahmed"
              />
            </div>

            <div className="et-field">
              <label className="et-label">Transaction Ref / Sender Account *</label>
              <input
                className="et-input"
                value={senderAccount}
                onChange={(e) => setSenderAccount(e.target.value)}
                placeholder="e.g. 1234567890"
              />
            </div>
          </div>

          <div className="et-field">
            <label className="et-label">Payment Screenshot *</label>
            <input
              className="et-file"
              type="file"
              accept="image/*"
              onChange={(e) => setShot(e.target.files?.[0] || null)}
            />
            {shot && <div className="et-fileHint">Selected: {shot.name}</div>}
          </div>

          {err && <div className="et-error">{err}</div>}

          <div className="et-note">
            After you submit, the admin will verify and approve your plan from the admin panel.
          </div>
        </div>

        <div className="et-modalFooter">
          <button className="et-btnGhost" onClick={onClose} disabled={loading}>
            Back
          </button>
          <button
            className="et-btnPrimary"
            onClick={submitPayment}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- shared: chart helpers ----------------
function normalizeItems(exp) {
  const arr = safeJsonParse(exp?.breakdown, []);
  const items = Array.isArray(arr)
    ? arr
        .map((x) => ({
          label: String(x?.label || "").trim(),
          value: Number(x?.value),
        }))
        .filter((x) => x.label && Number.isFinite(x.value) && x.value > 0)
    : [];
  return items;
}

function toChartData(exp) {
  const items = normalizeItems(exp);
  const labels = items.map((x) => x.label);
  const data = items.map((x) => x.value);

  const colors = [
    "#4dd2ff",
    "#71ffb6",
    "#ffd36a",
    "#ff7aa2",
    "#b58bff",
    "#ff9f40",
    "#36a2eb",
    "#9966ff",
    "#ff6384",
    "#4bc0c0",
  ];

  return {
    labels,
    datasets: [
      {
        label: "Value",
        data,
        backgroundColor: labels.map((_, i) => colors[i % colors.length]),
        borderWidth: 1,
      },
    ],
  };
}

function ChartBlock({ exp }) {
  const chartType = String(exp?.chartType || "none").toLowerCase();
  const data = toChartData(exp);
  const has = (data?.labels?.length || 0) > 0;

  if (chartType === "none") return null;

  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
      title: { display: false },
    },
  };

  return (
    <div className="et-chartBox">
      <div className="et-chartTitle">Chart ({chartType})</div>

      {!has ? (
        <div className="et-emptyMini">
          No breakdown data found. (Edit expense and add breakdown items)
        </div>
      ) : (
        <div className="et-chartCanvas">
          {chartType === "bar" ? (
            <Bar data={data} options={opts} />
          ) : chartType === "doughnut" ? (
            <Doughnut data={data} options={opts} />
          ) : chartType === "line" ? (
            <Line data={data} options={opts} />
          ) : (
            <Pie data={data} options={opts} />
          )}
        </div>
      )}
    </div>
  );
}

// ---------------- SmartArt (advanced) ----------------
function SmartArtBlock({ exp }) {
  const type = String(exp?.smartArtType || "none").toLowerCase();
  const items = normalizeItems(exp);

  if (type === "none") return null;

  const total = items.reduce((a, b) => a + (Number(b.value) || 0), 0);

  const header = (
    <div className="et-smartTop">
      <div className="et-smartTitle">Smart Art ({type})</div>
      <div className="et-smartMeta">
        <span className="et-pillSmall">Items: {items.length}</span>
        <span className="et-pillSmall">Total: {Number(total || 0).toLocaleString()}</span>
      </div>
    </div>
  );

  if (!items.length) {
    return (
      <div className="et-smartBox">
        {header}
        <div className="et-emptyMini">
          No breakdown data found. (Edit expense and add breakdown items)
        </div>
      </div>
    );
  }

  // list
  if (type === "list") {
    return (
      <div className="et-smartBox">
        {header}
        <div className="et-smartList">
          {items.map((it) => (
            <div key={it.label} className="et-smartRow">
              <div className="et-smartKey">{it.label}</div>
              <div className="et-smartVal">{it.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // cards
  if (type === "cards") {
    return (
      <div className="et-smartBox">
        {header}
        <div className="et-smartGrid">
          {items.map((it) => (
            <div key={it.label} className="et-smartCard">
              <div className="et-smartKey">{it.label}</div>
              <div className="et-smartVal">{it.value}</div>
              <div className="et-smartSub">
                {total ? `${Math.round((it.value / total) * 100)}%` : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // flow (horizontal steps with arrows)
  if (type === "flow") {
    return (
      <div className="et-smartBox">
        {header}
        <div className="et-flowWrap">
          {items.map((it, idx) => (
            <React.Fragment key={it.label}>
              <div className="et-flowStep">
                <div className="et-flowLabel">{it.label}</div>
                <div className="et-flowValue">{it.value}</div>
              </div>
              {idx !== items.length - 1 && <div className="et-flowArrow" />}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  // blocks (vertical pipeline)
  if (type === "blocks") {
    return (
      <div className="et-smartBox">
        {header}
        <div className="et-blocks">
          {items.map((it, idx) => (
            <div key={it.label} className="et-blockRow">
              <div className="et-blockIndex">{idx + 1}</div>
              <div className="et-blockCard">
                <div className="et-blockTitle">{it.label}</div>
                <div className="et-blockBadge">{it.value}</div>
              </div>
              {idx !== items.length - 1 && <div className="et-blockLine" />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // fallback -> cards
  return (
    <div className="et-smartBox">
      {header}
      <div className="et-smartGrid">
        {items.map((it) => (
          <div key={it.label} className="et-smartCard">
            <div className="et-smartKey">{it.label}</div>
            <div className="et-smartVal">{it.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Modal: Add Expense ----------------
function AddExpenseModal({ open, onClose, onAdded }) {
  const [section, setSection] = useState("general");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("PKR");

  const [category, setCategory] = useState("Food");
  const [subCategory, setSubCategory] = useState("Fruits");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(nowDate());
  const [time, setTime] = useState(nowTime());
  const [receipt, setReceipt] = useState(null);

  const [chartType, setChartType] = useState("none");
  const [smartArtType, setSmartArtType] = useState("none");

  const [items, setItems] = useState([
    { label: "Apple", value: "20" },
    { label: "Banana", value: "50" },
    { label: "Potato", value: "30" },
  ]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const categoryList = useMemo(
    () => Object.keys(CATEGORY_TREE[section] || {}),
    [section]
  );
  const subCategoryList = useMemo(() => {
    const catObj = CATEGORY_TREE[section]?.[category] || {};
    return Object.keys(catObj);
  }, [section, category]);
  const itemSuggestions = useMemo(() => {
    const catObj = CATEGORY_TREE[section]?.[category] || {};
    return catObj?.[subCategory] || [];
  }, [section, category, subCategory]);

  useEffect(() => {
    if (!open) return;

    setSection("general");
    setTitle("");
    setAmount("");
    setCurrency("PKR");
    setCategory("Food");
    setSubCategory("Fruits");
    setPaymentMethod("Cash");
    setNotes("");
    setDate(nowDate());
    setTime(nowTime());
    setReceipt(null);
    setChartType("none");
    setSmartArtType("none");
    setItems([
      { label: "Apple", value: "20" },
      { label: "Banana", value: "50" },
      { label: "Potato", value: "30" },
    ]);
    setErr("");
    setLoading(false);
  }, [open]);

  useEffect(() => {
    const cats = Object.keys(CATEGORY_TREE[section] || {});
    const nextCat = cats[0] || "Other";
    setCategory(nextCat);

    const subs = Object.keys(CATEGORY_TREE[section]?.[nextCat] || {});
    setSubCategory(subs[0] || "Other");
  }, [section]);

  useEffect(() => {
    const subs = Object.keys(CATEGORY_TREE[section]?.[category] || {});
    setSubCategory(subs[0] || "Other");
  }, [section, category]);

  if (!open) return null;

  function setItem(idx, key, val) {
    setItems((prev) =>
      prev.map((x, i) => (i === idx ? { ...x, [key]: val } : x))
    );
  }
  function addItemRow() {
    setItems((prev) => [...prev, { label: "", value: "" }]);
  }
  function removeItemRow(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submit() {
    try {
      setErr("");

      if (!title.trim()) return setErr("Title is required.");
      const amt = Number(amount);
      if (!amt || Number.isNaN(amt) || amt <= 0)
        return setErr("Amount must be greater than 0.");
      if (!date) return setErr("Date is required.");
      if (!time) return setErr("Time is required.");

      // ✅ FIX: breakdown should be saved if Chart OR SmartArt is selected
      const wantsBreakdown =
        String(chartType || "none") !== "none" ||
        String(smartArtType || "none") !== "none";

      const breakdown = wantsBreakdown
        ? items
            .map((x) => ({
              label: String(x.label || "").trim(),
              value: Number(x.value),
            }))
            .filter((x) => x.label && Number.isFinite(x.value) && x.value > 0)
        : [];

      setLoading(true);

      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("amount", String(amt));
      fd.append("currency", String(currency || "PKR").toUpperCase());
      fd.append("section", section);
      fd.append("category", (category || "Other").trim());
      fd.append("subCategory", (subCategory || "").trim());
      fd.append("paymentMethod", (paymentMethod || "").trim());
      fd.append("notes", (notes || "").trim());
      fd.append("date", date);
      fd.append("time", time);
      fd.append("chartType", chartType);
      fd.append("smartArtType", smartArtType);
      fd.append("breakdown", JSON.stringify(breakdown));
      if (receipt) fd.append("receipt", receipt);

      const res = await api.post("/expenses/add", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!res?.data?.success)
        throw new Error(res?.data?.message || "Failed to add expense");

      onAdded?.();
      onClose();
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Add failed");
    } finally {
      setLoading(false);
    }
  }

  const showBreakdown =
    String(chartType || "none") !== "none" ||
    String(smartArtType || "none") !== "none";

  return (
    <div className="et-modalOverlay" role="dialog" aria-modal="true">
      <div className="et-modal et-modalWide">
        <div className="et-modalHeader">
          <div>
            <h2 className="et-title">Add Expense</h2>
            <p className="et-subtitle">
              Create expense with categories, sub-categories, chart & smart art.
            </p>
          </div>

          <button className="et-iconBtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="et-modalBody et-scroll">
          <div className="et-grid2">
            <div className="et-field">
              <label className="et-label">Section *</label>
              <select
                className="et-select"
                value={section}
                onChange={(e) => setSection(e.target.value)}
              >
                <option value="general">General</option>
                <option value="muslim">Muslim</option>
              </select>
            </div>

            <div className="et-field">
              <label className="et-label">Currency</label>
              <select
                className="et-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="PKR">PKR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div className="et-grid2">
            <div className="et-field">
              <label className="et-label">Title *</label>
              <input
                className="et-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Grocery / Fuel"
              />
            </div>

            <div className="et-field">
              <label className="et-label">Amount *</label>
              <input
                className="et-input"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 1500"
              />
            </div>
          </div>

          <div className="et-grid3">
            <div className="et-field">
              <label className="et-label">Category</label>
              <select
                className="et-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categoryList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="et-field">
              <label className="et-label">Sub Category</label>
              <select
                className="et-select"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
              >
                {subCategoryList.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="et-field">
              <label className="et-label">Payment Method</label>
              <select
                className="et-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Bank">Bank</option>
                <option value="Easypaisa">Easypaisa</option>
                <option value="JazzCash">JazzCash</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="et-grid2">
            <div className="et-field">
              <label className="et-label">Date *</label>
              <input
                className="et-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="et-field">
              <label className="et-label">Time *</label>
              <input
                className="et-input"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="et-grid2">
            <div className="et-field">
              <label className="et-label">Receipt (optional)</label>
              <input
                className="et-file"
                type="file"
                accept="image/*"
                onChange={(e) => setReceipt(e.target.files?.[0] || null)}
              />
              {receipt && <div className="et-fileHint">Selected: {receipt.name}</div>}
            </div>

            <div className="et-field">
              <label className="et-label">Notes (optional)</label>
              <textarea
                className="et-textarea"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any details..."
              />
            </div>
          </div>

          <div className="et-divider" />

          <div className="et-grid2">
            <div className="et-field">
              <label className="et-label">Chart Type</label>
              <select
                className="et-select"
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
              >
                <option value="none">None</option>
                <option value="pie">Pie</option>
                <option value="doughnut">Doughnut</option>
                <option value="bar">Bar</option>
                <option value="line">Line</option>
              </select>
              <div className="et-miniHint">
                Chart uses Breakdown items.
              </div>
            </div>

            <div className="et-field">
              <label className="et-label">Smart Art</label>
              <select
                className="et-select"
                value={smartArtType}
                onChange={(e) => setSmartArtType(e.target.value)}
              >
                <option value="none">None</option>
                <option value="cards">Cards</option>
                <option value="list">List</option>
                <option value="flow">Flow</option>
                <option value="blocks">Blocks</option>
              </select>
              <div className="et-miniHint">
                Smart Art uses Breakdown items.
              </div>
            </div>
          </div>

          {/* ✅ FIX: breakdown should appear if Chart OR SmartArt selected */}
          {showBreakdown && (
            <div className="et-breakdown">
              <div className="et-breakTop">
                <div className="et-breakTitle">Breakdown Items</div>
                <button className="et-btnMini" onClick={addItemRow} type="button">
                  + Add Row
                </button>
              </div>

              <div className="et-miniHint">
                Suggestions for {category} → {subCategory}:{" "}
                <span className="et-pillSmall">
                  {itemSuggestions.join(", ") || "—"}
                </span>
              </div>

              {items.map((it, idx) => (
                <div key={idx} className="et-breakRow">
                  <input
                    className="et-input"
                    placeholder="Label (e.g. Apple)"
                    value={it.label}
                    onChange={(e) => setItem(idx, "label", e.target.value)}
                  />
                  <input
                    className="et-input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Value (e.g. 20)"
                    value={it.value}
                    onChange={(e) => setItem(idx, "value", e.target.value)}
                  />
                  <button
                    className="et-btnDangerMini"
                    onClick={() => removeItemRow(idx)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {err && <div className="et-error">{err}</div>}
        </div>

        <div className="et-modalFooter">
          <button className="et-btnGhost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="et-btnPrimary" onClick={submit} disabled={loading}>
            {loading ? "Saving..." : "Add Expense"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- Modal: Edit Expense ----------------
function EditExpenseModal({ open, onClose, exp, onSaved }) {
  const [section, setSection] = useState("general");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("PKR");

  const [category, setCategory] = useState("Food");
  const [subCategory, setSubCategory] = useState("Fruits");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(nowDate());
  const [time, setTime] = useState(nowTime());
  const [receipt, setReceipt] = useState(null);

  const [chartType, setChartType] = useState("none");
  const [smartArtType, setSmartArtType] = useState("none");
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const categoryList = useMemo(
    () => Object.keys(CATEGORY_TREE[section] || {}),
    [section]
  );
  const subCategoryList = useMemo(() => {
    const catObj = CATEGORY_TREE[section]?.[category] || {};
    return Object.keys(catObj);
  }, [section, category]);
  const itemSuggestions = useMemo(() => {
    const catObj = CATEGORY_TREE[section]?.[category] || {};
    return catObj?.[subCategory] || [];
  }, [section, category, subCategory]);

  useEffect(() => {
    if (!open || !exp) return;

    setSection(exp.section || "general");
    setTitle(exp.title || "");
    setAmount(String(exp.amount ?? ""));
    setCurrency(exp.currency || "PKR");
    setCategory(exp.category || "Other");
    setSubCategory(exp.subCategory || "Other");
    setPaymentMethod(exp.paymentMethod || "Cash");
    setNotes(exp.notes || "");

    const dt = new Date(exp.occurredAt || exp.createdAt || Date.now());
    setDate(`${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`);
    setTime(`${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`);

    setReceipt(null);
    setChartType(String(exp.chartType || "none").toLowerCase());
    setSmartArtType(String(exp.smartArtType || "none").toLowerCase());

    const b = safeJsonParse(exp.breakdown, []);
    setItems(
      Array.isArray(b)
        ? b.map((x) => ({ label: x.label || "", value: String(x.value ?? "") }))
        : []
    );

    setErr("");
    setLoading(false);
  }, [open, exp]);

  useEffect(() => {
    if (!open) return;
    const cats = Object.keys(CATEGORY_TREE[section] || {});
    if (cats.length && !cats.includes(category)) setCategory(cats[0]);
  }, [open, section]); // eslint-disable-line

  useEffect(() => {
    if (!open) return;
    const subs = Object.keys(CATEGORY_TREE[section]?.[category] || {});
    if (subs.length && !subs.includes(subCategory)) setSubCategory(subs[0]);
  }, [open, section, category]); // eslint-disable-line

  if (!open || !exp) return null;

  function setItem(idx, key, val) {
    setItems((prev) =>
      prev.map((x, i) => (i === idx ? { ...x, [key]: val } : x))
    );
  }
  function addItemRow() {
    setItems((prev) => [...prev, { label: "", value: "" }]);
  }
  function removeItemRow(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submit() {
    try {
      setErr("");
      if (!title.trim()) return setErr("Title is required.");
      const amt = Number(amount);
      if (!amt || Number.isNaN(amt) || amt <= 0)
        return setErr("Amount must be greater than 0.");
      if (!date) return setErr("Date is required.");
      if (!time) return setErr("Time is required.");

      const wantsBreakdown =
        String(chartType || "none") !== "none" ||
        String(smartArtType || "none") !== "none";

      const breakdown = wantsBreakdown
        ? items
            .map((x) => ({
              label: String(x.label || "").trim(),
              value: Number(x.value),
            }))
            .filter((x) => x.label && Number.isFinite(x.value) && x.value > 0)
        : [];

      setLoading(true);

      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("amount", String(amt));
      fd.append("currency", String(currency || "PKR").toUpperCase());
      fd.append("section", section);
      fd.append("category", (category || "Other").trim());
      fd.append("subCategory", (subCategory || "").trim());
      fd.append("paymentMethod", (paymentMethod || "").trim());
      fd.append("notes", (notes || "").trim());
      fd.append("date", date);
      fd.append("time", time);
      fd.append("chartType", chartType);
      fd.append("smartArtType", smartArtType);
      fd.append("breakdown", JSON.stringify(breakdown));
      if (receipt) fd.append("receipt", receipt);

      const res = await api.put(`/expenses/${exp.id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!res?.data?.success)
        throw new Error(res?.data?.message || "Failed to update");

      onSaved?.();
      onClose();
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Update failed");
    } finally {
      setLoading(false);
    }
  }

  const showBreakdown =
    String(chartType || "none") !== "none" ||
    String(smartArtType || "none") !== "none";

  return (
    <div className="et-modalOverlay" role="dialog" aria-modal="true">
      <div className="et-modal et-modalWide">
        <div className="et-modalHeader">
          <div>
            <h2 className="et-title">Edit Expense</h2>
            <p className="et-subtitle">Update details, chart & smart art.</p>
          </div>

          <button className="et-iconBtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="et-modalBody et-scroll">
          <div className="et-grid2">
            <div className="et-field">
              <label className="et-label">Section *</label>
              <select
                className="et-select"
                value={section}
                onChange={(e) => setSection(e.target.value)}
              >
                <option value="general">General</option>
                <option value="muslim">Muslim</option>
              </select>
            </div>

            <div className="et-field">
              <label className="et-label">Currency</label>
              <select
                className="et-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="PKR">PKR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div className="et-grid2">
            <div className="et-field">
              <label className="et-label">Title *</label>
              <input
                className="et-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="et-field">
              <label className="et-label">Amount *</label>
              <input
                className="et-input"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="et-grid3">
            <div className="et-field">
              <label className="et-label">Category</label>
              <select
                className="et-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categoryList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="et-field">
              <label className="et-label">Sub Category</label>
              <select
                className="et-select"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
              >
                {subCategoryList.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="et-field">
              <label className="et-label">Payment Method</label>
              <select
                className="et-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Bank">Bank</option>
                <option value="Easypaisa">Easypaisa</option>
                <option value="JazzCash">JazzCash</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="et-grid2">
            <div className="et-field">
              <label className="et-label">Date *</label>
              <input
                className="et-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="et-field">
              <label className="et-label">Time *</label>
              <input
                className="et-input"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="et-grid2">
            <div className="et-field">
              <label className="et-label">Receipt (optional)</label>
              <input
                className="et-file"
                type="file"
                accept="image/*"
                onChange={(e) => setReceipt(e.target.files?.[0] || null)}
              />
              {receipt && <div className="et-fileHint">Selected: {receipt.name}</div>}
              <div className="et-miniHint">(Old receipt will stay if you don’t upload a new one)</div>
            </div>

            <div className="et-field">
              <label className="et-label">Notes</label>
              <textarea
                className="et-textarea"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="et-divider" />

          <div className="et-grid2">
            <div className="et-field">
              <label className="et-label">Chart Type</label>
              <select
                className="et-select"
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
              >
                <option value="none">None</option>
                <option value="pie">Pie</option>
                <option value="doughnut">Doughnut</option>
                <option value="bar">Bar</option>
                <option value="line">Line</option>
              </select>
            </div>

            <div className="et-field">
              <label className="et-label">Smart Art</label>
              <select
                className="et-select"
                value={smartArtType}
                onChange={(e) => setSmartArtType(e.target.value)}
              >
                <option value="none">None</option>
                <option value="cards">Cards</option>
                <option value="list">List</option>
                <option value="flow">Flow</option>
                <option value="blocks">Blocks</option>
              </select>
            </div>
          </div>

          {showBreakdown && (
            <div className="et-breakdown">
              <div className="et-breakTop">
                <div className="et-breakTitle">Breakdown Items</div>
                <button className="et-btnMini" onClick={addItemRow} type="button">
                  + Add Row
                </button>
              </div>

              <div className="et-miniHint">
                Suggestions for {category} → {subCategory}:{" "}
                <span className="et-pillSmall">{itemSuggestions.join(", ") || "—"}</span>
              </div>

              {(items.length ? items : [{ label: "", value: "" }]).map((it, idx) => (
                <div key={idx} className="et-breakRow">
                  <input
                    className="et-input"
                    placeholder="Label"
                    value={it.label}
                    onChange={(e) => setItem(idx, "label", e.target.value)}
                  />
                  <input
                    className="et-input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Value"
                    value={it.value}
                    onChange={(e) => setItem(idx, "value", e.target.value)}
                  />
                  <button className="et-btnDangerMini" onClick={() => removeItemRow(idx)} type="button">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {err && <div className="et-error">{err}</div>}
        </div>

        <div className="et-modalFooter">
          <button className="et-btnGhost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="et-btnPrimary" onClick={submit} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- Modal: Add to Existing Expense ----------------
function AddToExpenseModal({ open, onClose, exp, onSaved }) {
  const [amountDelta, setAmountDelta] = useState("");
  const [labelPick, setLabelPick] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const existingLabels = useMemo(() => {
    const arr = safeJsonParse(exp?.breakdown, []);
    return Array.isArray(arr)
      ? arr.map((x) => String(x?.label || "").trim()).filter(Boolean)
      : [];
  }, [exp]);

  const hasBreakdown =
    String(exp?.chartType || "none") !== "none" ||
    String(exp?.smartArtType || "none") !== "none";

  useEffect(() => {
    if (!open || !exp) return;
    setAmountDelta("");
    setLabelPick(existingLabels[0] || "");
    setNewLabel("");
    setValue("");
    setErr("");
    setLoading(false);
  }, [open, exp, existingLabels]);

  if (!open || !exp) return null;

  const finalLabel =
    labelPick === "__new__" ? String(newLabel || "").trim() : String(labelPick || "").trim();

  async function submit() {
    try {
      setErr("");

      const d = Number(amountDelta);
      if (!d || Number.isNaN(d) || d <= 0) return setErr("Amount to add must be > 0");

      if (hasBreakdown && finalLabel) {
        const v = Number(value);
        if (!v || Number.isNaN(v) || v <= 0) return setErr("Breakdown value must be > 0");
      }

      setLoading(true);

      const res = await api.post(`/expenses/${exp.id}/add`, {
        amountDelta: d,
        breakdownLabel: hasBreakdown ? finalLabel : "",
        breakdownValue: hasBreakdown && finalLabel ? Number(value) : 0,
      });

      if (!res?.data?.success) throw new Error(res?.data?.message || "Add failed");

      onSaved?.();
      onClose();
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Add failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="et-modalOverlay" role="dialog" aria-modal="true">
      <div className="et-modal">
        <div className="et-modalHeader">
          <div>
            <h2 className="et-title">Add to Expense</h2>
            <p className="et-subtitle">
              Expense: <strong>{exp.title}</strong>
            </p>
          </div>

          <button className="et-iconBtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="et-modalBody et-scroll">
          <div className="et-field">
            <label className="et-label">Add Amount *</label>
            <input
              className="et-input"
              type="number"
              min="0"
              step="0.01"
              value={amountDelta}
              onChange={(e) => setAmountDelta(e.target.value)}
              placeholder="e.g. 200"
            />
            <div className="et-miniHint">
              This will increase total amount (current: {fmtMoney(exp.currency, exp.amount)}).
            </div>
          </div>

          {hasBreakdown && (
            <>
              <div className="et-field">
                <label className="et-label">Breakdown Item (optional)</label>
                <select
                  className="et-select"
                  value={labelPick}
                  onChange={(e) => setLabelPick(e.target.value)}
                >
                  <option value="">(Skip)</option>
                  {existingLabels.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                  <option value="__new__">+ New Item</option>
                </select>
                <div className="et-miniHint">
                  Choose existing item, or pick “New Item”, or keep Skip.
                </div>
              </div>

              {labelPick === "__new__" && (
                <div className="et-field">
                  <label className="et-label">New Item Label *</label>
                  <input
                    className="et-input"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="e.g. Tomato"
                  />
                </div>
              )}

              {finalLabel && (
                <div className="et-field">
                  <label className="et-label">Add Value for "{finalLabel}" *</label>
                  <input
                    className="et-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="e.g. 5"
                  />
                </div>
              )}
            </>
          )}

          {err && <div className="et-error">{err}</div>}
        </div>

        <div className="et-modalFooter">
          <button className="et-btnGhost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="et-btnPrimary" onClick={submit} disabled={loading}>
            {loading ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------- Page ----------------
export default function UserExpenses() {
  const [sub, setSub] = useState({
    active: false,
    plan: "free",
    validUntil: null,
    status: "none",
  });

  const [offer, setOffer] = useState(null);

  const [showPlans, setShowPlans] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [chosen, setChosen] = useState(null);

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editExp, setEditExp] = useState(null);

  const [showAddTo, setShowAddTo] = useState(false);
  const [addToExp, setAddToExp] = useState(null);

  const [tab, setTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const categories = useMemo(() => {
    const set = new Set(["all"]);
    (DEFAULT_CATEGORIES[tab] || []).forEach((c) => set.add(c));
    (expenses || [])
      .filter((e) => String(e.section || "") === tab)
      .forEach((e) => set.add(e.category || "Other"));
    return Array.from(set);
  }, [expenses, tab]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (expenses || [])
      .filter((e) => (tab ? e.section === tab : true))
      .filter((e) => (category === "all" ? true : (e.category || "Other") === category))
      .filter((e) => {
        if (!s) return true;
        return (
          String(e.title || "").toLowerCase().includes(s) ||
          String(e.notes || "").toLowerCase().includes(s) ||
          String(e.category || "").toLowerCase().includes(s) ||
          String(e.subCategory || "").toLowerCase().includes(s)
        );
      });
  }, [expenses, tab, category, search]);

  async function fetchStatus() {
    try {
      const r = await api.get("/payments/status");
      setSub({
        active: !!r.data?.isActive,
        plan: r.data?.subscriptionPlan || "free",
        validUntil: r.data?.subscriptionEnd || null,
        status: r.data?.status || "none",
      });
    } catch {}
  }

  async function fetchOffer() {
    try {
      const r = await api.get("/offers/active");
      const latest = Array.isArray(r.data) ? r.data[0] : null;

      if (latest && Number(latest.percentOff || 0) > 0) {
        setOffer({
          active: true,
          discountPercent: Number(latest.percentOff || 0),
          title: latest.name || "Special Offer",
          message: latest.description || "",
          appliesTo: String(latest.appliesTo || "all"),
        });
      } else {
        setOffer(null);
      }
    } catch {
      setOffer(null);
    }
  }

  async function fetchExpenses() {
    try {
      setErr("");
      setLoading(true);
      const r = await api.get("/expenses/list", { params: { section: "all" } });
      setExpenses(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    fetchOffer();
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function requireActiveOrPlans() {
    if (!sub.active) {
      setShowPlans(true);
      return false;
    }
    return true;
  }

  function onClickAddExpense() {
    if (!requireActiveOrPlans()) return;
    setShowAdd(true);
  }

  function onChoosePlan(selection) {
    setChosen(selection);
    setShowPlans(false);
    setShowPay(true);
  }

  async function exportAllExcel() {
    await downloadViaApi(
      `/expenses/export/excel?section=${encodeURIComponent(tab)}`,
      `expenses_${tab}.xlsx`
    );
  }
  async function exportAllPdf() {
    await downloadViaApi(
      `/expenses/export/pdf?section=${encodeURIComponent(tab)}`,
      `expenses_${tab}.pdf`
    );
  }
  async function exportSingleExcel(id) {
    await downloadViaApi(
      `/expenses/export/excel?section=${encodeURIComponent(tab)}&id=${id}`,
      `expense_${id}.xlsx`
    );
  }
  async function exportSinglePdf(id) {
    await downloadViaApi(
      `/expenses/export/pdf?section=${encodeURIComponent(tab)}&id=${id}`,
      `expense_${id}.pdf`
    );
  }

  async function deleteExpense(exp) {
    if (!requireActiveOrPlans()) return;
    const ok = window.confirm(`Delete expense "${exp.title}"?`);
    if (!ok) return;

    try {
      await api.delete(`/expenses/${exp.id}`);
      await fetchExpenses();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Delete failed");
    }
  }

  function openEdit(exp) {
    if (!requireActiveOrPlans()) return;
    setEditExp(exp);
    setShowEdit(true);
  }
  function openAddTo(exp) {
    if (!requireActiveOrPlans()) return;
    setAddToExp(exp);
    setShowAddTo(true);
  }

  return (
    <div className="et-page">
      <style>{styles}</style>

      <div className="et-topRow">
        <div className="et-leftGroup">
          <button className="et-chip" onClick={exportAllExcel}>
            Export All (Excel)
          </button>
          <button className="et-chip" onClick={exportAllPdf}>
            Export All (PDF)
          </button>

          <div className="et-tabs">
            <button
              className={clsx("et-tab", tab === "general" && "isActive")}
              onClick={() => setTab("general")}
            >
              General
            </button>
            <button
              className={clsx("et-tab", tab === "muslim" && "isActive")}
              onClick={() => setTab("muslim")}
            >
              Muslim
            </button>
          </div>

          <div className="et-subBox">
            <div className="et-subPlan">
              Plan: <strong>{planLabel(sub.plan)}</strong>
            </div>
            <div className="et-subSmall">
              {sub.active ? `Valid until ${sub.validUntil || "-"}` : "No active plan"}
            </div>
          </div>

          <button
            className="et-chip"
            onClick={() => {
              fetchStatus();
              fetchOffer();
              fetchExpenses();
            }}
          >
            Check Status
          </button>
        </div>

        <button className="et-btnPrimary" onClick={onClickAddExpense}>
          + Add Expense
        </button>
      </div>

      <div className="et-filters">
        <input
          className="et-input"
          placeholder="Search title, notes, category, sub-category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="et-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All Categories" : c}
            </option>
          ))}
        </select>

        <div className="et-count">
          Showing <strong>{filtered.length}</strong>
        </div>
      </div>

      <div className="et-card">
        <div className="et-cardHead">
          <div className="et-cardTitle">
            {tab === "general" ? "General Expenses" : "Muslim Expenses"}
          </div>
          <div className="et-cardHint">Click “Details” to expand the row.</div>
        </div>

        {loading ? (
          <div className="et-empty">Loading...</div>
        ) : err ? (
          <div className="et-error">{err}</div>
        ) : filtered.length === 0 ? (
          <div className="et-empty">No expenses yet.</div>
        ) : (
          <div className="et-list">
            {filtered.map((e) => (
              <ExpenseRow
                key={e.id}
                exp={e}
                onEdit={() => openEdit(e)}
                onAddTo={() => openAddTo(e)}
                onDelete={() => deleteExpense(e)}
                onExportExcel={() => exportSingleExcel(e.id)}
                onExportPdf={() => exportSinglePdf(e.id)}
              />
            ))}
          </div>
        )}
      </div>

      <SubscriptionPlansModal
        open={showPlans}
        onClose={() => setShowPlans(false)}
        onChoosePlan={onChoosePlan}
        offer={offer}
        defaultCurrency="PKR"
      />

      <SubmitPaymentModal
        open={showPay}
        onClose={() => setShowPay(false)}
        selection={chosen}
        onSubmitted={() => fetchStatus()}
      />

      <AddExpenseModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={() => {
          fetchExpenses();
          fetchStatus();
        }}
      />

      <EditExpenseModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        exp={editExp}
        onSaved={() => fetchExpenses()}
      />

      <AddToExpenseModal
        open={showAddTo}
        onClose={() => setShowAddTo(false)}
        exp={addToExp}
        onSaved={() => fetchExpenses()}
      />
    </div>
  );
}

// ---------------- Row with inline details ----------------
function ExpenseRow({ exp, onEdit, onAddTo, onDelete, onExportExcel, onExportPdf }) {
  const [open, setOpen] = useState(false);
  const receiptUrl = exp.receipt ? `${FILE_BASE}${exp.receipt}` : null;

  return (
    <div className="et-rowCard">
      <div className="et-rowMain">
        <div className="et-colTitle">
          <div className="et-expTitle">{exp.title}</div>
          <div className="et-expSmall">
            {(exp.category || "-") + (exp.subCategory ? ` • ${exp.subCategory}` : "")} •{" "}
            {exp.paymentMethod || "-"} •{" "}
            {new Date(exp.occurredAt || exp.createdAt || Date.now()).toLocaleString()}
          </div>
        </div>

        <div className="et-amt">{fmtMoney(exp.currency, exp.amount)}</div>

        <div className="et-actions">
          <button className="et-btnMini" onClick={() => setOpen((v) => !v)}>
            {open ? "Hide" : "Details"}
          </button>

          <button className="et-btnMini" onClick={onEdit}>Edit</button>
          <button className="et-btnMini" onClick={onAddTo}>Add</button>
          <button className="et-btnDangerMini" onClick={onDelete}>Delete</button>

          <button className="et-btnMini" onClick={onExportExcel}>Excel</button>
          <button className="et-btnMini" onClick={onExportPdf}>PDF</button>
        </div>
      </div>

      {open && (
        <div className="et-details">
          <div className="et-detailsGrid">
            <div className="et-detailBlock">
              <div className="et-detailLabel">Section</div>
              <div className="et-detailValue">{exp.section}</div>
            </div>
            <div className="et-detailBlock">
              <div className="et-detailLabel">Category</div>
              <div className="et-detailValue">
                {exp.category || "-"} {exp.subCategory ? `→ ${exp.subCategory}` : ""}
              </div>
            </div>
            <div className="et-detailBlock">
              <div className="et-detailLabel">Chart</div>
              <div className="et-detailValue">{exp.chartType || "none"}</div>
            </div>
            <div className="et-detailBlock">
              <div className="et-detailLabel">Smart Art</div>
              <div className="et-detailValue">{exp.smartArtType || "none"}</div>
            </div>

            <div className="et-detailBlock">
              <div className="et-detailLabel">Payment</div>
              <div className="et-detailValue">{exp.paymentMethod || "-"}</div>
            </div>
            <div className="et-detailBlock">
              <div className="et-detailLabel">Notes</div>
              <div className="et-detailValue">{exp.notes || "-"}</div>
            </div>

            <div className="et-detailBlock et-receiptBlock">
              <div className="et-detailLabel">Receipt</div>
              {receiptUrl ? (
                <a href={receiptUrl} target="_blank" rel="noreferrer" className="et-link">
                  View Receipt
                </a>
              ) : (
                <div className="et-detailValue">No receipt</div>
              )}
              {receiptUrl && <img src={receiptUrl} alt="Receipt" className="et-receiptImg" />}
            </div>
          </div>

          <div className="et-detailsExtra">
            <ChartBlock exp={exp} />
            <SmartArtBlock exp={exp} />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- styles ----------------
const styles = `
.et-page{padding:22px 22px 40px;color:#eaf6ff;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
.et-topRow{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px}
.et-leftGroup{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.et-chip{border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.12);color:#eaf6ff;padding:10px 14px;border-radius:999px;cursor:pointer;transition:.15s}
.et-chip:hover{transform:translateY(-1px);background:rgba(255,255,255,.06)}
.et-tabs{display:flex;gap:10px}
.et-tab{border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.14);color:#eaf6ff;padding:10px 16px;border-radius:999px;cursor:pointer}
.et-tab.isActive{background:rgba(56,189,248,.16);border-color:rgba(56,189,248,.5);color:#bfeaff}
.et-btnPrimary{border:0;background:#3ab7ff;color:#001018;padding:12px 18px;border-radius:999px;font-weight:800;cursor:pointer}
.et-btnPrimary:hover{filter:brightness(1.05);transform:translateY(-1px)}
.et-subBox{border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.12);border-radius:16px;padding:10px 14px}
.et-subSmall{opacity:.85;font-size:12px;margin-top:2px}
.et-filters{border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.12);border-radius:18px;padding:14px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:16px}
.et-input,.et-select{border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.25);color:#eaf6ff;border-radius:14px;padding:12px 14px;outline:none}
.et-input{min-width:280px;flex:1}
.et-select{min-width:220px}
.et-count{opacity:.9}
.et-card{border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.12);border-radius:22px;padding:18px}
.et-cardHead{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px}
.et-cardTitle{font-size:26px;font-weight:900}
.et-cardHint{opacity:.85}
.et-empty{padding:20px;opacity:.9}
.et-error{padding:12px 14px;border-radius:14px;background:rgba(255,70,70,.12);border:1px solid rgba(255,70,70,.25);color:#ffd2d2;margin-top:10px}
.et-list{display:flex;flex-direction:column;gap:12px}
.et-rowCard{border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.14);border-radius:18px;overflow:hidden}
.et-rowMain{display:flex;gap:12px;align-items:center;padding:14px;flex-wrap:wrap}
.et-colTitle{flex:1;min-width:240px}
.et-expTitle{font-size:18px;font-weight:900}
.et-expSmall{opacity:.85;font-size:12px;margin-top:4px}
.et-amt{font-size:18px;font-weight:900;color:#71d5ff}
.et-actions{display:flex;gap:8px;flex-wrap:wrap}
.et-btnMini{border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.18);color:#eaf6ff;padding:10px 12px;border-radius:12px;cursor:pointer}
.et-btnMini:hover{background:rgba(255,255,255,.06)}
.et-btnDangerMini{border:1px solid rgba(255,120,120,.35);background:rgba(255,70,70,.10);color:#ffd2d2;padding:10px 12px;border-radius:12px;cursor:pointer}
.et-btnDangerMini:hover{background:rgba(255,70,70,.16)}
.et-details{border-top:1px solid rgba(255,255,255,.08);padding:14px}
.et-detailsGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
@media (max-width:980px){.et-detailsGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:520px){.et-detailsGrid{grid-template-columns:1fr}}
.et-detailBlock{border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.18);border-radius:16px;padding:12px}
.et-detailLabel{opacity:.85;font-size:12px}
.et-detailValue{font-weight:800;margin-top:6px}
.et-link{color:#8fe1ff;font-weight:800;text-decoration:none}
.et-link:hover{text-decoration:underline}
.et-receiptBlock{grid-column:span 2}
@media (max-width:520px){.et-receiptBlock{grid-column:span 1}}
.et-receiptImg{width:100%;max-height:220px;object-fit:cover;border-radius:14px;margin-top:10px;border:1px solid rgba(255,255,255,.10)}
.et-detailsExtra{margin-top:14px;display:grid;grid-template-columns:1.2fr .8fr;gap:12px}
@media (max-width:980px){.et-detailsExtra{grid-template-columns:1fr}}
.et-chartBox,.et-smartBox{border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.14);border-radius:18px;padding:12px}
.et-chartTitle{font-weight:900;margin-bottom:10px}
.et-chartCanvas{height:240px}
.et-emptyMini{opacity:.85;font-weight:800;padding:10px;border:1px dashed rgba(255,255,255,.16);border-radius:14px;background:rgba(0,0,0,.10)}
.et-smartTop{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap;margin-bottom:10px}
.et-smartTitle{font-weight:900}
.et-smartMeta{display:flex;gap:8px;flex-wrap:wrap}
.et-smartGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.et-smartCard{border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.16);border-radius:16px;padding:10px;position:relative}
.et-smartSub{opacity:.85;font-weight:800;font-size:12px;margin-top:6px}
.et-smartList{display:flex;flex-direction:column;gap:8px}
.et-smartRow{display:flex;justify-content:space-between;gap:10px;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.16);border-radius:14px;padding:10px}
.et-smartKey{font-weight:900}
.et-smartVal{font-weight:900;color:#71d5ff}

/* SmartArt FLOW */
.et-flowWrap{display:flex;align-items:center;flex-wrap:wrap;gap:10px}
.et-flowStep{min-width:150px;flex:0 0 auto;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.16);border-radius:16px;padding:10px}
.et-flowLabel{font-weight:900}
.et-flowValue{margin-top:6px;font-weight:900;color:#71d5ff}
.et-flowArrow{width:40px;height:14px;position:relative;flex:0 0 auto}
.et-flowArrow:before{content:"";position:absolute;left:0;top:50%;transform:translateY(-50%);width:100%;height:2px;background:rgba(255,255,255,.22)}
.et-flowArrow:after{content:"";position:absolute;right:-2px;top:50%;transform:translateY(-50%) rotate(45deg);width:10px;height:10px;border-right:2px solid rgba(255,255,255,.22);border-top:2px solid rgba(255,255,255,.22)}

/* SmartArt BLOCKS */
.et-blocks{display:flex;flex-direction:column;gap:10px}
.et-blockRow{position:relative}
.et-blockIndex{width:34px;height:34px;border-radius:999px;display:grid;place-items:center;font-weight:900;background:rgba(56,189,248,.18);border:1px solid rgba(56,189,248,.35);color:#bfeaff;margin-bottom:8px}
.et-blockCard{display:flex;justify-content:space-between;gap:10px;align-items:center;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.16);border-radius:16px;padding:12px}
.et-blockTitle{font-weight:900}
.et-blockBadge{font-weight:1000;color:#71d5ff;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.18);padding:6px 10px;border-radius:999px}
.et-blockLine{height:16px;border-left:2px dashed rgba(255,255,255,.18);margin-left:16px;margin-top:6px}

/* Modals */
.et-modalOverlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:18px;z-index:9999}
.et-modal{width:min(900px,96vw);max-height:92vh;border-radius:22px;border:1px solid rgba(255,255,255,.14);background:rgba(8,14,22,.92);box-shadow:0 30px 90px rgba(0,0,0,.55);overflow:hidden;display:flex;flex-direction:column}
.et-modalWide{width:min(1100px,96vw)}
.et-modalHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:18px 18px 10px}
.et-title{font-size:26px;margin:0;font-weight:900}
.et-subtitle{margin:6px 0 0;opacity:.86}
.et-iconBtn{border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.18);color:#eaf6ff;width:44px;height:44px;border-radius:14px;cursor:pointer}
.et-modalBody{padding:14px 18px 18px}
.et-scroll{overflow-y:auto}
.et-modalFooter{padding:14px 18px 18px;display:flex;justify-content:flex-end;gap:10px;border-top:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.08)}
.et-btnGhost{border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.18);color:#eaf6ff;padding:12px 16px;border-radius:14px;cursor:pointer}
.et-btnGhost:hover{background:rgba(255,255,255,.06)}
.et-row{display:flex;gap:12px;align-items:center}
.et-rowBetween{justify-content:space-between}
.et-rowWrap{flex-wrap:wrap}
.et-inline{display:flex;gap:8px;align-items:center}
.et-labelSmall{font-size:12px;opacity:.85}
.et-hint{opacity:.9}
.et-pill{display:inline-block;margin-left:8px;padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.18);font-weight:800}
.et-pillSmall{display:inline-block;padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.12);font-weight:800;font-size:12px}
.et-offerBanner{border:1px solid rgba(56,189,248,.25);background:rgba(56,189,248,.10);border-radius:18px;padding:12px 14px;margin-bottom:14px}
.et-offerTag{display:inline-block;padding:6px 10px;border-radius:999px;background:rgba(56,189,248,.18);border:1px solid rgba(56,189,248,.35);font-weight:900;margin-bottom:10px}
.et-offerText{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.et-offerPercent{font-weight:900;color:#8fe1ff}
.et-planGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:12px}
@media (max-width:980px){.et-planGrid{grid-template-columns:1fr}}
.et-planCard{border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.14);border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:12px}
.et-planTop{display:flex;justify-content:space-between;align-items:center;gap:10px}
.et-planName{font-size:18px;font-weight:900}
.et-badge{padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);font-weight:800;font-size:12px}
.et-priceBox{border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.18);border-radius:16px;padding:12px}
.et-priceLine{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}
.et-priceOld{opacity:.75;text-decoration:line-through}
.et-priceNew{font-size:22px;font-weight:1000;color:#71d5ff}
.et-priceSub{opacity:.85;font-size:12px;margin-top:6px}
.et-featureList{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px}
.et-featureItem{opacity:.95;display:flex;gap:8px;align-items:flex-start}
.et-check{color:#71d5ff;font-weight:900;margin-top:1px}
.et-btnFull{width:100%}
.et-note{opacity:.85;margin-top:12px}
.et-payInfo{border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.14);border-radius:18px;padding:12px 14px;margin-bottom:14px}
.et-payRow{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)}
.et-payRow:last-child{border-bottom:0}
.et-payLabel{opacity:.85}
.et-payValue{font-weight:900}
.et-payHint{opacity:.85;margin-top:10px}
.et-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.et-grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
@media (max-width:900px){.et-grid3{grid-template-columns:1fr}}
@media (max-width:720px){.et-grid2{grid-template-columns:1fr}}
.et-field{display:flex;flex-direction:column;gap:8px;margin-top:10px}
.et-label{font-weight:900}
.et-file{color:#eaf6ff}
.et-fileHint{opacity:.85;font-size:12px;margin-top:4px}
.et-textarea{border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.25);color:#eaf6ff;border-radius:14px;padding:12px 14px;outline:none;resize:vertical}
.et-divider{height:1px;background:rgba(255,255,255,.10);margin:14px 0}
.et-miniHint{opacity:.85;font-size:12px}
.et-breakdown{border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.12);border-radius:18px;padding:12px;margin-top:10px}
.et-breakTop{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
.et-breakTitle{font-weight:900}
.et-breakRow{display:grid;grid-template-columns:1.2fr .8fr auto;gap:10px;margin-top:10px}
@media (max-width:720px){.et-breakRow{grid-template-columns:1fr}}
`;
