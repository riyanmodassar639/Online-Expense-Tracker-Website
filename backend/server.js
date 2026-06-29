const express = require("express");
const cors = require("cors");
const path = require("path");

// tables init (in db.js)
require("./config/db");

const app = express();

app.use(
  cors({
    origin: (origin, cb) => cb(null, true),
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= Routes =================
const authRoutes = require("./routes/authRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const offerRoutes = require("./routes/offerRoutes");

// ✅ NEW
const publicRoutes = require("./routes/publicRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/offers", offerRoutes);

// ✅ NEW
app.use("/api/public", publicRoutes);

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});