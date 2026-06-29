const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const DB_DIR = path.join(__dirname, "..", "..", "database");
fs.mkdirSync(DB_DIR, { recursive: true });
const DB_PATH = path.join(DB_DIR, "expense.db");

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) console.error("❌ SQLite connection error:", err.message);
  else console.log("✅ SQLite connected:", DB_PATH);
});

// ---- small async helpers ----
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
  });
}

async function ensureColumn(table, col, type, defaultSql = null) {
  const info = await all(`PRAGMA table_info(${table})`);
  const exists = info.some((c) => c.name === col);
  if (exists) return;

  const def = defaultSql !== null ? ` DEFAULT ${defaultSql}` : "";
  await run(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}${def}`);
  console.log(`🧩 Migrated: ${table}.${col} added`);
}

async function migrate() {
  // ---- Create tables (for fresh installs) ----
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      email TEXT UNIQUE,
      phone TEXT,
      password TEXT,
      profilePic TEXT,
      status TEXT DEFAULT 'inactive',
      subscriptionPlan TEXT DEFAULT NULL,
      subscriptionStart TEXT DEFAULT NULL,
      subscriptionEnd TEXT DEFAULT NULL,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'PKR',
      section TEXT DEFAULT 'general',
      category TEXT DEFAULT '',
      subCategory TEXT DEFAULT '',
      paymentMethod TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      occurredAt TEXT NOT NULL,
      receipt TEXT DEFAULT NULL,
      chartType TEXT DEFAULT 'none',
      smartArtType TEXT DEFAULT 'none',
      breakdown TEXT DEFAULT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      plan TEXT NOT NULL,
      currency TEXT NOT NULL,
      amount REAL NOT NULL,
      senderName TEXT,
      senderAccount TEXT,
      screenshot TEXT,
      status TEXT DEFAULT 'pending',
      offerName TEXT DEFAULT NULL,
      offerPercentOff REAL DEFAULT 0,
      decisionAt TEXT DEFAULT NULL,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      type TEXT,
      message TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      percentOff REAL DEFAULT 0,
      appliesTo TEXT DEFAULT 'all',
      enabled INTEGER DEFAULT 1,
      startsAt TEXT DEFAULT NULL,
      endsAt TEXT DEFAULT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT NULL
    )
  `);

  // ---- MIGRATIONS for existing DBs ----
  // users
  await ensureColumn("users", "status", "TEXT", "'inactive'");
  await ensureColumn("users", "subscriptionPlan", "TEXT", "NULL");
  await ensureColumn("users", "subscriptionStart", "TEXT", "NULL");
  await ensureColumn("users", "subscriptionEnd", "TEXT", "NULL");

  // payments
  await ensureColumn("payments", "status", "TEXT", "'pending'");
  await ensureColumn("payments", "offerName", "TEXT", "NULL");
  await ensureColumn("payments", "offerPercentOff", "REAL", "0");
  await ensureColumn("payments", "decisionAt", "TEXT", "NULL");

  // offers
  await ensureColumn("offers", "name", "TEXT", "''");
  await ensureColumn("offers", "description", "TEXT", "''");
  await ensureColumn("offers", "percentOff", "REAL", "0");
  await ensureColumn("offers", "appliesTo", "TEXT", "'all'");
  await ensureColumn("offers", "enabled", "INTEGER", "1");
  await ensureColumn("offers", "startsAt", "TEXT", "NULL");
  await ensureColumn("offers", "endsAt", "TEXT", "NULL");
  await ensureColumn("offers", "updatedAt", "TEXT", "NULL");

  // ✅ expenses new columns
  await ensureColumn("expenses", "subCategory", "TEXT", "''");
  await ensureColumn("expenses", "chartType", "TEXT", "'none'");
  await ensureColumn("expenses", "smartArtType", "TEXT", "'none'");
  await ensureColumn("expenses", "breakdown", "TEXT", "NULL");

  // Optional backfill if your OLD offers table had title/message
  try {
    const cols = await all(`PRAGMA table_info(offers)`);
    const hasTitle = cols.some((c) => c.name === "title");
    const hasMessage = cols.some((c) => c.name === "message");
    if (hasTitle) await run(`UPDATE offers SET name = COALESCE(NULLIF(name,''), title)`);
    if (hasMessage) await run(`UPDATE offers SET description = COALESCE(NULLIF(description,''), message)`);
  } catch {}

  console.log("✅ DB migration done");
}

db.serialize(() => {
  migrate().catch((e) => console.error("❌ DB migrate error:", e.message));
});

module.exports = db;
