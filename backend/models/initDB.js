const db = require("../config/db");

// Small migration helper (SQLite)
function addColumnIfMissing(table, column, typeSql) {
  db.all(`PRAGMA table_info(${table})`, [], (err, cols) => {
    if (err) return console.log(`❌ PRAGMA ${table} failed:`, err.message);
    const exists = (cols || []).some((c) => c.name === column);
    if (exists) return;

    db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${typeSql}`, (e) => {
      if (e) console.log(`❌ Failed add column ${table}.${column}:`, e.message);
      else console.log(`✅ Added column ${table}.${column}`);
    });
  });
}

/* ===================== USERS ===================== */
db.run(
  `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  firstName TEXT,
  lastName TEXT,
  address TEXT,
  username TEXT UNIQUE,
  password TEXT,
  profilePic TEXT,
  status TEXT DEFAULT 'inactive'
)
`,
  (err) => {
    if (err) console.log("❌ Users table error:", err.message);
    else console.log("✅ Users table ready");

    // Migrations (safe for existing DB)
    addColumnIfMissing("users", "phone", "TEXT");
    addColumnIfMissing("users", "subscriptionPlan", "TEXT");
    addColumnIfMissing("users", "subscriptionEnd", "TEXT");
    addColumnIfMissing("users", "resetCodeHash", "TEXT");
    addColumnIfMissing("users", "resetCodeExpiry", "INTEGER");
  }
);

/* ===================== PAYMENTS ===================== */
db.run(
  `
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  plan TEXT NOT NULL,                -- monthly | yearly | 2years
  currency TEXT DEFAULT 'PKR',       -- PKR | USD | EUR
  amount REAL DEFAULT 0,
  senderName TEXT,
  senderAccount TEXT,
  screenshot TEXT,
  status TEXT DEFAULT 'pending',     -- pending | approved | rejected
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(userId) REFERENCES users(id)
)
`,
  (err) => {
    if (err) console.log("❌ Payments table error:", err.message);
    else console.log("✅ Payments table ready");

    // If table existed earlier, ensure columns exist
    addColumnIfMissing("payments", "currency", "TEXT");
    addColumnIfMissing("payments", "amount", "REAL");
    addColumnIfMissing("payments", "senderName", "TEXT");
    addColumnIfMissing("payments", "senderAccount", "TEXT");
    addColumnIfMissing("payments", "screenshot", "TEXT");
    addColumnIfMissing("payments", "status", "TEXT");
    addColumnIfMissing("payments", "createdAt", "TEXT");
  }
);

/* ===================== EXPENSES ===================== */
db.run(
  `
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'PKR',
  section TEXT DEFAULT 'general',    -- general | muslim
  category TEXT,
  paymentMethod TEXT,
  notes TEXT,
  occurredAt TEXT NOT NULL,          -- ISO datetime
  receipt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT,
  FOREIGN KEY(userId) REFERENCES users(id)
)
`,
  (err) => {
    if (err) console.log("❌ Expenses table error:", err.message);
    else console.log("✅ Expenses table ready");

    addColumnIfMissing("expenses", "currency", "TEXT");
    addColumnIfMissing("expenses", "section", "TEXT");
    addColumnIfMissing("expenses", "category", "TEXT");
    addColumnIfMissing("expenses", "paymentMethod", "TEXT");
    addColumnIfMissing("expenses", "notes", "TEXT");
    addColumnIfMissing("expenses", "occurredAt", "TEXT");
    addColumnIfMissing("expenses", "receipt", "TEXT");
    addColumnIfMissing("expenses", "createdAt", "TEXT");
    addColumnIfMissing("expenses", "updatedAt", "TEXT");
  }
);

/* ===================== ACTIVITIES ===================== */
db.run(
  `
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  type TEXT NOT NULL,                -- add | edit | delete | export | payment
  message TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(userId) REFERENCES users(id)
)
`,
  (err) => {
    if (err) console.log("❌ Activities table error:", err.message);
    else console.log("✅ Activities table ready");
  }
);
