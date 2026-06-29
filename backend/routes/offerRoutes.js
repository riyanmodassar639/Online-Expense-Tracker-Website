const express = require("express");
const router = express.Router();
const db = require("../config/db");

// GET /api/offers/active
router.get("/active", (req, res) => {
  const now = new Date().toISOString();

  db.all(
    `
    SELECT id, name, description, percentOff, appliesTo, enabled, startsAt, endsAt
    FROM offers
    WHERE enabled=1
      AND (startsAt IS NULL OR startsAt='' OR startsAt <= ?)
      AND (endsAt   IS NULL OR endsAt=''   OR endsAt   >= ?)
    ORDER BY id DESC
  `,
    [now, now],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows || []);
    }
  );
});

module.exports = router;
