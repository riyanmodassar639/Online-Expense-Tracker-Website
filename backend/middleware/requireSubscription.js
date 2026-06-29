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

module.exports = function requireSubscription(req, res, next) {
  const userId = getUserId(req);
  if (!userId) return res.status(400).json({ message: "User ID is required" });

  db.get(
    `SELECT status, subscriptionPlan, subscriptionEnd FROM users WHERE id=?`,
    [String(userId)],
    (err, user) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!user) return res.status(404).json({ message: "User not found" });

      if (String(user.status || "").toLowerCase() !== "active") {
        return res.status(403).json({ message: "Account is not active" });
      }

      const end = user.subscriptionEnd ? new Date(user.subscriptionEnd) : null;
      const now = new Date();

      if (!user.subscriptionPlan || !end || end <= now) {
        return res.status(402).json({ message: "Subscription required" });
      }

      next();
    }
  );
};
