const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Public website statistics
router.get("/stats", (req, res) => {
  db.get(
    `
    SELECT
      (SELECT COUNT(*) FROM users WHERE status='active') AS approvedUsers,
      (SELECT COUNT(*) FROM expenses) AS totalExpenses,
      (SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='approved') AS totalPayments
    `,
    [],
    (err, row) => {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      }

      res.json({
        approvedUsers: Number(row?.approvedUsers || 0),
        totalExpenses: Number(row?.totalExpenses || 0),
        totalPayments: Number(row?.totalPayments || 0),
      });
    }
  );
});

module.exports = router;