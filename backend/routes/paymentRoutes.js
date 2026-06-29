const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const db = require("../config/db");

function getUserId(req) {
  return (
    req?.headers?.["x-user-id"] ||
    req?.headers?.["userid"] ||
    req?.body?.userId ||
    req?.query?.userId ||
    null
  );
}

function normalizePlan(plan) {
  const p = String(plan || "").toLowerCase();
  if (p === "monthly" || p === "month" || p === "m") return "monthly";
  if (p === "yearly" || p === "year" || p === "y") return "yearly";
  if (p === "2years" || p === "two_years" || p === "2year" || p === "two years") return "two_years";
  return "monthly";
}

function baseAmount(plan, currency) {
  const p = normalizePlan(plan);
  const c = String(currency || "PKR").toUpperCase();

  const map = {
    PKR: { monthly: 100, yearly: 1000, two_years: 2000 },
    USD: { monthly: 1, yearly: 10, two_years: 20 },
    EUR: { monthly: 1, yearly: 10, two_years: 20 },
  };

  const table = map[c] || map.PKR;
  return Number(table[p] || table.monthly);
}

function applyOffer(amount, percentOff) {
  const p = Number(percentOff || 0);
  if (!p || p <= 0) return amount;
  const discounted = amount - (amount * p) / 100;
  return Math.round(discounted * 100) / 100;
}

// uploads (payment screenshots)
const PAY_DIR = path.join(__dirname, "..", "uploads", "payments");
fs.mkdirSync(PAY_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, PAY_DIR),
  filename: (_, file, cb) => cb(null, Date.now() + "_" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage });

// activity
function logActivity(userId, type, message) {
  db.run(
    `INSERT INTO activities (userId, type, message, createdAt) VALUES (?, ?, ?, datetime('now'))`,
    [String(userId), type, message],
    () => {}
  );
}

// GET /api/payments/offer  (for pricing modal)
router.get("/offer", (req, res) => {
  const now = new Date().toISOString();

  db.get(
    `
    SELECT id, name, description, percentOff, appliesTo, enabled
    FROM offers
    WHERE enabled=1
      AND (startsAt IS NULL OR startsAt='' OR startsAt <= ?)
      AND (endsAt   IS NULL OR endsAt=''   OR endsAt   >= ?)
    ORDER BY id DESC
    LIMIT 1
  `,
    [now, now],
    (err, row) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!row) {
        return res.json({ active: false, discountPercent: 0, title: "", message: "" });
      }
      res.json({
        active: true,
        discountPercent: Number(row.percentOff || 0),
        title: row.name || "Limited Offer",
        message: row.description || "",
        appliesTo: row.appliesTo || "all",
      });
    }
  );
});

// POST /api/payments/submit
router.post("/submit", upload.single("screenshot"), (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(400).json({ message: "User ID is required" });

  const plan = normalizePlan(req.body.plan);
  const currency = String(req.body.currency || "PKR").toUpperCase();
  const senderName = (req.body.senderName || "").trim();
  const senderAccount = (req.body.senderAccount || req.body.transactionRef || "").trim();

  if (!senderName) return res.status(400).json({ message: "Sender name is required" });
  if (!senderAccount) return res.status(400).json({ message: "Account/Transaction ref is required" });
  if (!req.file) return res.status(400).json({ message: "Payment screenshot is required" });

  const screenshotPath = "/uploads/payments/" + path.basename(req.file.path);

  const now = new Date().toISOString();
  db.get(
    `
    SELECT id, name, description, percentOff, appliesTo
    FROM offers
    WHERE enabled=1
      AND (startsAt IS NULL OR startsAt='' OR startsAt <= ?)
      AND (endsAt   IS NULL OR endsAt=''   OR endsAt   >= ?)
    ORDER BY id DESC
    LIMIT 1
  `,
    [now, now],
    (err, offer) => {
      if (err) return res.status(500).json({ message: err.message });

      let amount = baseAmount(plan, currency);
      let offerName = null;
      let offerPercentOff = 0;

      if (offer) {
        const appliesTo = String(offer.appliesTo || "all").toLowerCase();
        const ok = appliesTo === "all" || appliesTo === plan;
        if (ok) {
          offerName = offer.name;
          offerPercentOff = Number(offer.percentOff || 0);
          amount = applyOffer(amount, offerPercentOff);
        }
      }

      db.run(
        `
        INSERT INTO payments (userId, plan, currency, amount, senderName, senderAccount, screenshot, status, offerName, offerPercentOff, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, datetime('now'))
      `,
        [String(userId), plan, currency, amount, senderName, senderAccount, screenshotPath, offerName, offerPercentOff],
        function (e2) {
          if (e2) return res.status(500).json({ message: e2.message });

          logActivity(userId, "subscription", `Subscription request submitted: ${plan.toUpperCase()} (${currency} ${amount})`);
          res.json({ success: true, id: this.lastID, amount, currency, plan, offerName, offerPercentOff });
        }
      );
    }
  );
});

// GET /api/payments/status  (subscription + latest payment status)
router.get("/status", (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(400).json({ message: "User ID is required" });

  db.get(
    `SELECT status, subscriptionPlan, subscriptionEnd FROM users WHERE id=?`,
    [String(userId)],
    (err, u) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!u) return res.status(404).json({ message: "User not found" });

      const end = u.subscriptionEnd ? new Date(u.subscriptionEnd) : null;
      const active =
        !!(u.subscriptionPlan && end && end > new Date() && String(u.status || "").toLowerCase() === "active");

      // latest payment status
      db.get(
        `SELECT status, plan, createdAt, decisionAt
         FROM payments
         WHERE userId=?
         ORDER BY id DESC
         LIMIT 1`,
        [String(userId)],
        (e2, p) => {
          if (e2) return res.status(500).json({ message: e2.message });

          const paymentStatus = active ? "approved" : (p?.status || "none");

          res.json({
            // ✅ frontend keys
            active,
            plan: u.subscriptionPlan || "free",
            validUntil: u.subscriptionEnd || null,
            status: paymentStatus,          // pending/approved/rejected/none

            // extra info (optional)
            accountStatus: u.status || "inactive",
            lastPayment: p || null,

            // old compatibility keys
            isActive: active,
            subscriptionPlan: u.subscriptionPlan || "free",
            subscriptionEnd: u.subscriptionEnd || null,
          });
        }
      );
    }
  );
});


module.exports = router;
