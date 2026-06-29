const express = require("express");
const router = express.Router();
const db = require("../config/db");

function normalizePlan(plan) {
  const p = String(plan || "").toLowerCase();
  if (p === "monthly" || p === "month" || p === "m") return "monthly";
  if (p === "yearly" || p === "year" || p === "y") return "yearly";
  if (p === "2years" || p === "two_years" || p === "2year" || p === "two years") return "two_years";
  return "monthly";
}
function durationModifier(plan) {
  const p = normalizePlan(plan);
  if (p === "yearly") return "+1 year";
  if (p === "two_years") return "+2 years";
  return "+1 month";
}
function logActivity(userId, type, message) {
  db.run(
    `INSERT INTO activities (userId, type, message, createdAt) VALUES (?, ?, ?, datetime('now'))`,
    [String(userId), type, message],
    () => {}
  );
}

// -------------------- ADMIN LOGIN --------------------
router.post("/login", (req, res) => {
  const { email, username, password } = req.body || {};

  const adminEmail = email || username;

  if (
    (adminEmail === "admin@gmail.com" || adminEmail === "admin") &&
    password === "admin123"
  ) {
    return res.json({
      success: true,
      admin: {
        username: "admin",
        email: "admin@gmail.com",
      },
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid admin credentials",
  });
});
// -------------------- STATS (fix 404) --------------------
router.get("/stats", (req, res) => {
  const count = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => (err ? reject(err) : resolve(Number(row?.c || 0))));
    });

  Promise.all([
    count(`SELECT COUNT(*) c FROM users`),
    count(`SELECT COUNT(*) c FROM users WHERE lower(status)='active'`),
    count(`SELECT COUNT(*) c FROM users WHERE lower(status)='inactive'`),
   count(`SELECT COUNT(*) c FROM users WHERE lower(status)='blocked'`),
    count(`SELECT COUNT(*) c FROM payments WHERE lower(status)='pending'`),
    count(`SELECT COUNT(*) c FROM payments WHERE lower(status)='approved'`),
    count(`SELECT COUNT(*) c FROM payments WHERE lower(status)='rejected'`),
  ])
    .then(([usersTotal, usersActive, usersInactive, usersBlocked, payPending, payApproved, payRejected]) => {
      res.json({
        usersTotal,
        usersActive,
        usersInactive,
        usersBlocked,
        payments: { pending: payPending, approved: payApproved, rejected: payRejected },
      });
    })
    .catch((e) => res.status(500).json({ message: e.message }));
});

// -------------------- USERS --------------------
// GET /api/admin/users?status=all|active|inactive|blocked|deleted
router.get("/users", (req, res) => {
  const status = String(req.query.status || "all").toLowerCase();
  let where = "";
  const params = [];

  if (status !== "all") {
    where = "WHERE lower(status)=?";
    params.push(status);
  }

  db.all(
    `
    SELECT id, username, email, phone, profilePic, status, subscriptionPlan, subscriptionStart, subscriptionEnd
    FROM users
    ${where}
    ORDER BY id DESC
  `,
    params,
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows || []);
    }
  );
});

function setUserStatus(userId, status, res, activityMsg) {
  db.run(`UPDATE users SET status=? WHERE id=?`, [status, userId], function (err) {
    if (err) return res.status(500).json({ message: err.message });
    logActivity(userId, "account", activityMsg || `Account status changed to ${status}`);
    res.json({ success: true });
  });
}

// aliases used by your frontend
router.put("/approve/:userId", (req, res) => setUserStatus(req.params.userId, "active", res, "Account approved by admin"));
router.put("/approve-subscription/:userId", (req, res) => setUserStatus(req.params.userId, "active", res, "Account approved by admin"));
router.put("/inactive/:userId", (req, res) => setUserStatus(req.params.userId, "inactive", res));
router.put("/block/:userId", (req, res) => setUserStatus(req.params.userId, "blocked", res));
router.put("/delete/:userId", (req, res) => setUserStatus(req.params.userId, "deleted", res, "Account soft-deleted by admin"));

// standard status endpoint
router.put("/users/:id/status", (req, res) => {
  const id = req.params.id;
  const status = String(req.body.status || "").toLowerCase();
  if (!["active", "inactive", "blocked", "deleted"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  setUserStatus(id, status, res);
});

// hard delete (optional)
router.delete("/users/:id", (req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM users WHERE id=?`, [id], function (err) {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ success: true });
  });
});

// -------------------- PAYMENTS --------------------
// GET /api/admin/payments?status=pending|all
router.get("/payments", (req, res) => {
  const status = String(req.query.status || "pending").toLowerCase();

  let where = "";
  const params = [];
  if (status !== "all") {
    where = "WHERE lower(p.status)=?";
    params.push(status);
  }

  db.all(
    `
    SELECT p.*, u.username as username, u.profilePic as profilePic
    FROM payments p
    JOIN users u ON u.id = p.userId
    ${where}
    ORDER BY p.id DESC
  `,
    params,
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows || []);
    }
  );
});

// PUT /api/admin/payments/:id/approve  { plan?: monthly/yearly/2years/two_years }
router.put("/payments/:id/approve", (req, res) => {
  const id = req.params.id;
  const forcedPlan = req.body?.plan ? normalizePlan(req.body.plan) : null;

  db.get(`SELECT * FROM payments WHERE id=?`, [id], (e0, p) => {
    if (e0) return res.status(500).json({ message: e0.message });
    if (!p) return res.status(404).json({ message: "Payment not found" });

    const plan = forcedPlan || normalizePlan(p.plan);
    const mod = durationModifier(plan);

    // ✅ subscriptionStart/subscriptionEnd columns MUST exist (db.js migration ensures it)
    db.run(
      `
      UPDATE users
      SET subscriptionPlan=?,
          subscriptionStart=datetime('now'),
          subscriptionEnd=datetime('now', ?),
          status='active'
      WHERE id=?
    `,
      [plan, mod, p.userId],
      (e1) => {
        if (e1) return res.status(500).json({ message: e1.message });

        db.run(
          `UPDATE payments SET status='approved', decisionAt=datetime('now'), plan=? WHERE id=?`,
          [plan, id],
          (e2) => {
            if (e2) return res.status(500).json({ message: e2.message });

            logActivity(p.userId, "subscription", `Subscription approved: ${plan.toUpperCase()}`);
            res.json({ success: true, message: `Approved: ${plan}` });
          }
        );
      }
    );
  });
});

// PUT /api/admin/payments/:id/reject
router.put("/payments/:id/reject", (req, res) => {
  const id = req.params.id;

  db.get(`SELECT * FROM payments WHERE id=?`, [id], (e0, p) => {
    if (e0) return res.status(500).json({ message: e0.message });
    if (!p) return res.status(404).json({ message: "Payment not found" });

    db.run(`UPDATE payments SET status='rejected', decisionAt=datetime('now') WHERE id=?`, [id], (e1) => {
      if (e1) return res.status(500).json({ message: e1.message });

      logActivity(p.userId, "subscription", `Subscription rejected: ${normalizePlan(p.plan).toUpperCase()}`);
      res.json({ success: true, message: "Rejected" });
    });
  });
});

// -------------------- OFFERS --------------------
// GET /api/admin/offers
router.get("/offers", (req, res) => {
  db.all(`SELECT * FROM offers ORDER BY id DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows || []);
  });
});

// GET /api/admin/offers/:id  (if your frontend calls /offers/1)
router.get("/offers/:id", (req, res) => {
  db.get(`SELECT * FROM offers WHERE id=?`, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!row) return res.status(404).json({ message: "Offer not found" });
    res.json(row);
  });
});

// POST /api/admin/offers
router.post("/offers", (req, res) => {
  const name = (req.body.name || "").trim();
  const description = (req.body.description || "").trim();
  const percentOff = Number(req.body.percentOff || 0);
  const appliesTo = String(req.body.appliesTo || "all").toLowerCase();
  const enabled = req.body.enabled === 0 || req.body.enabled === "0" ? 0 : 1;
  const startsAt = (req.body.startsAt || "").trim() || null;
  const endsAt = (req.body.endsAt || "").trim() || null;

  if (!name) return res.status(400).json({ message: "Offer name is required" });
  if (Number.isNaN(percentOff) || percentOff < 0 || percentOff > 100) {
    return res.status(400).json({ message: "percentOff must be 0-100" });
  }
  if (!["all", "monthly", "yearly", "two_years"].includes(appliesTo)) {
    return res.status(400).json({ message: "Invalid appliesTo" });
  }

  db.run(
    `
    INSERT INTO offers (name, description, percentOff, appliesTo, enabled, startsAt, endsAt, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `,
    [name, description, percentOff, appliesTo, enabled, startsAt, endsAt],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// PUT /api/admin/offers/:id
router.put("/offers/:id", (req, res) => {
  const id = req.params.id;
  const name = (req.body.name || "").trim();
  const description = (req.body.description || "").trim();
  const percentOff = Number(req.body.percentOff || 0);
  const appliesTo = String(req.body.appliesTo || "all").toLowerCase();
  const enabled = req.body.enabled === 0 || req.body.enabled === "0" ? 0 : 1;
  const startsAt = (req.body.startsAt || "").trim() || null;
  const endsAt = (req.body.endsAt || "").trim() || null;

  if (!name) return res.status(400).json({ message: "Offer name is required" });
  if (Number.isNaN(percentOff) || percentOff < 0 || percentOff > 100) {
    return res.status(400).json({ message: "percentOff must be 0-100" });
  }
  if (!["all", "monthly", "yearly", "two_years"].includes(appliesTo)) {
    return res.status(400).json({ message: "Invalid appliesTo" });
  }

  db.run(
    `
    UPDATE offers
    SET name=?, description=?, percentOff=?, appliesTo=?, enabled=?, startsAt=?, endsAt=?, updatedAt=datetime('now')
    WHERE id=?
  `,
    [name, description, percentOff, appliesTo, enabled, startsAt, endsAt, id],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ success: true });
    }
  );
});

// DELETE /api/admin/offers/:id
router.delete("/offers/:id", (req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM offers WHERE id=?`, [id], function (err) {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ success: true });
  });
});

module.exports = router;
