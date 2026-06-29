const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/stats", (req, res) => {
  db.get("SELECT COUNT(*) as users FROM users", [], (e, u) => {
    db.get("SELECT COUNT(*) as payments FROM payments", [], (e2, p) => {
      res.json({
        totalUsers: u.users,
        totalPayments: p.payments
      });
    });
  });
});

module.exports = router;
