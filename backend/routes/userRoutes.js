const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/dashboard", (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ message: "userId required" });

  db.get(
    `SELECT id, username, status, subscriptionPlan, subscriptionEnd FROM users WHERE id=?`,
    [userId],
    (e1, user) => {
      if (e1) return res.status(500).json({ message: e1.message });
      if (!user) return res.status(404).json({ message: "User not found" });

      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      db.all(
        `SELECT currency, COALESCE(SUM(amount),0) as total FROM expenses WHERE userId=? GROUP BY currency`,
        [userId],
        (e2, totalsAll) => {
          if (e2) return res.status(500).json({ message: e2.message });

          db.all(
            `SELECT currency, COALESCE(SUM(amount),0) as total FROM expenses WHERE userId=? AND month=? GROUP BY currency`,
            [userId, month],
            (e3, totalsMonth) => {
              if (e3) return res.status(500).json({ message: e3.message });

              db.get(
                `SELECT COUNT(*) as cnt FROM expenses WHERE userId=?`,
                [userId],
                (e4, cAll) => {
                  if (e4) return res.status(500).json({ message: e4.message });

                  db.get(
                    `SELECT COUNT(*) as cnt FROM expenses WHERE userId=? AND month=?`,
                    [userId, month],
                    (e5, cMonth) => {
                      if (e5) return res.status(500).json({ message: e5.message });

                      db.all(
                        `SELECT type,message,createdAt FROM activities WHERE userId=? ORDER BY datetime(createdAt) DESC LIMIT 8`,
                        [userId],
                        (e6, acts) => {
                          if (e6) return res.status(500).json({ message: e6.message });

                          return res.json({
                            user,
                            month,
                            totalsAll: totalsAll || [],
                            totalsMonth: totalsMonth || [],
                            counts: { all: cAll?.cnt || 0, month: cMonth?.cnt || 0 },
                            activities: acts || [],
                          });
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

module.exports = router;
