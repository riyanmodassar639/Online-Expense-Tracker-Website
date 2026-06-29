const db = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const payDir = path.join(__dirname, "..", "uploads", "payments");
if (!fs.existsSync(payDir)) fs.mkdirSync(payDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, payDir),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname),
});

exports.upload = multer({ storage }).single("screenshot");

function logActivity(userId, type, message) {
  db.run(`INSERT INTO activities (userId,type,message) VALUES (?,?,?)`, [userId, type, message], () => {});
}

exports.subscriptionStatus = (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ message: "userId required" });

  db.get(
    `SELECT status, subscriptionPlan, subscriptionEnd FROM users WHERE id=?`,
    [userId],
    (err, u) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!u) return res.status(404).json({ message: "User not found" });

      const now = new Date();
      const end = u.subscriptionEnd ? new Date(u.subscriptionEnd) : null;
      const active = u.status === "active" && end && end > now;

      return res.json({
        accountStatus: u.status,
        subscriptionPlan: u.subscriptionPlan || null,
        subscriptionEnd: u.subscriptionEnd || null,
        hasActiveSubscription: !!active,
        expired: !!(end && end <= now),
      });
    }
  );
};

exports.submitPayment = (req, res) => {
  const { userId, requestedPlan, currency, amount, senderName, senderAccount } = req.body;

  if (!userId || !requestedPlan || !currency || !amount) {
    return res.status(400).json({ message: "Missing fields" });
  }
  if (!req.file) return res.status(400).json({ message: "Payment screenshot is required" });

  const screenshot = `/uploads/payments/${req.file.filename}`;

  db.run(
    `
    INSERT INTO payments (userId, requestedPlan, currency, amount, senderName, senderAccount, screenshot, status)
    VALUES (?,?,?,?,?,?,?, 'pending')
    `,
    [userId, requestedPlan, currency, Number(amount), senderName || null, senderAccount || null, screenshot],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });

      logActivity(userId, "subscription_submit", `Subscription payment submitted (${requestedPlan.toUpperCase()}).`);

      return res.json({ success: true, message: "Payment submitted. Waiting for admin approval." });
    }
  );
};
