const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

const db = require("../config/db");
const requireSubscription = require("../middleware/requireSubscription");

// ---------- Uploads (receipts) ----------
const RECEIPT_DIR = path.join(__dirname, "..", "uploads", "receipts");
fs.mkdirSync(RECEIPT_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, RECEIPT_DIR),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "_" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage });

// ---------- helpers ----------
function requireUserId(req, res) {
  const userId = req?.headers?.["x-user-id"] || req?.body?.userId || req?.query?.userId;
  if (!userId) {
    res.status(400).json({ message: "userId required" });
    return null;
  }
  return String(userId);
}

function logActivity(userId, type, message) {
  db.run(
    `INSERT INTO activities (userId, type, message, createdAt) VALUES (?, ?, ?, datetime('now'))`,
    [String(userId), type, message],
    () => {}
  );
}

function normalizeSection(v) {
  const s = String(v || "general").toLowerCase();
  return s === "muslim" ? "muslim" : "general";
}

function pickDate(body) {
  return body.date || body.expenseDate || body.occurredDate || body.dateValue || "";
}
function pickTime(body) {
  return body.time || body.expenseTime || body.occurredTime || body.timeValue || "";
}

function toIsoDateTime(dateStr, timeStr) {
  const raw = (dateStr || "").trim();
  if (raw.includes("T") && raw.includes("Z")) return raw;

  let yyyy = "";
  let mm = "";
  let dd = "";

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [d, m, y] = raw.split("/");
    dd = d;
    mm = m;
    yyyy = y;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    [yyyy, mm, dd] = raw.split("-");
  }

  const t = (timeStr || "00:00").trim();
  const safeTime =
    /^\d{2}:\d{2}(:\d{2})?$/.test(t) ? (t.length === 5 ? `${t}:00` : t) : "00:00:00";

  if (!yyyy) return new Date().toISOString();

  const local = new Date(`${yyyy}-${mm}-${dd}T${safeTime}`);
  return local.toISOString();
}

function safeJsonParse(v, fallback) {
  try {
    if (v === null || v === undefined || v === "") return fallback;
    if (typeof v === "object") return v;
    return JSON.parse(String(v));
  } catch {
    return fallback;
  }
}

function normalizeBreakdown(input) {
  const arr = safeJsonParse(input, []);
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => ({
      label: String(x?.label || x?.name || "").trim(),
      value: Number(x?.value),
    }))
    .filter((x) => x.label && Number.isFinite(x.value) && x.value > 0);
}

// ---------- export helpers ----------
async function exportExcel(res, filename, rows) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Expenses");
  ws.columns = [
    { header: "ID", key: "id", width: 8 },
    { header: "Title", key: "title", width: 28 },
    { header: "Section", key: "section", width: 12 },
    { header: "Category", key: "category", width: 18 },
    { header: "SubCategory", key: "subCategory", width: 18 },
    { header: "Payment Method", key: "paymentMethod", width: 18 },
    { header: "Currency", key: "currency", width: 10 },
    { header: "Amount", key: "amount", width: 12 },
    { header: "Chart Type", key: "chartType", width: 12 },
    { header: "SmartArt", key: "smartArtType", width: 12 },
    { header: "Breakdown(JSON)", key: "breakdown", width: 40 },
    { header: "Date/Time", key: "occurredAt", width: 24 },
    { header: "Notes", key: "notes", width: 40 },
    { header: "Receipt", key: "receipt", width: 28 },
  ];

  rows.forEach((r) => ws.addRow(r));
  ws.getRow(1).font = { bold: true };

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  await wb.xlsx.write(res);
  res.end();
}

function exportPdf(res, filename, rows, title = "Expenses") {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 36 });
  doc.pipe(res);

  doc.fontSize(18).text(title, { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("#555").text(`Exported: ${new Date().toLocaleString()}`);
  doc.moveDown(1);

  doc.fillColor("#000");
  rows.forEach((r, idx) => {
    doc.fontSize(12).text(`${idx + 1}. ${r.title}`);
    doc.fontSize(10).fillColor("#333");
    doc.text(`Section: ${r.section || "-"}`);
    doc.text(`Category: ${r.category || "-"}`);
    if (r.subCategory) doc.text(`SubCategory: ${r.subCategory}`);
    doc.text(`Amount: ${r.currency || ""} ${r.amount}`);
    doc.text(`Chart: ${r.chartType || "none"} | SmartArt: ${r.smartArtType || "none"}`);
    if (r.breakdown) doc.text(`Breakdown: ${r.breakdown}`);
    doc.text(`Date/Time: ${r.occurredAt}`);
    if (r.paymentMethod) doc.text(`Payment: ${r.paymentMethod}`);
    if (r.notes) doc.text(`Notes: ${r.notes}`);
    if (r.receipt) doc.text(`Receipt: ${r.receipt}`);
    doc.moveDown(0.8);
    doc.fillColor("#000");
  });

  doc.end();
}

// ---------- routes ----------

// GET /api/expenses/list?section=general|muslim|all&category=...&search=...&month=YYYY-MM
router.get("/list", (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const section = String(req.query.section || "all").toLowerCase();
  const category = (req.query.category || "").trim();
  const search = (req.query.search || "").trim().toLowerCase();
  const month = (req.query.month || "").trim();

  let where = "WHERE userId=?";
  const params = [userId];

  if (section !== "all") {
    where += " AND section=?";
    params.push(normalizeSection(section));
  }
  if (category && category !== "all") {
    where += " AND category=?";
    params.push(category);
  }
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    where += " AND substr(occurredAt, 1, 7) = ?";
    params.push(month);
  }
  if (search) {
    where += " AND (lower(title) LIKE ? OR lower(notes) LIKE ? OR lower(category) LIKE ? OR lower(subCategory) LIKE ?)";
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }

  db.all(
    `SELECT * FROM expenses ${where} ORDER BY datetime(occurredAt) DESC, id DESC`,
    params,
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows || []);
    }
  );
});

// POST /api/expenses/add (requires active subscription)
router.post("/add", upload.single("receipt"), requireSubscription, (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const title = (req.body.title || "").trim();
  const amount = Number(req.body.amount);
  const currency = (req.body.currency || "PKR").toUpperCase();
  const section = normalizeSection(req.body.section);
  const category = (req.body.category || "").trim();
  const subCategory = (req.body.subCategory || "").trim();
  const paymentMethod = (req.body.paymentMethod || "").trim();
  const notes = (req.body.notes || "").trim();

  const chartType = String(req.body.chartType || "none").toLowerCase();
  const smartArtType = String(req.body.smartArtType || "none").toLowerCase();
  const breakdownArr = normalizeBreakdown(req.body.breakdown);

  const dateVal = pickDate(req.body);
  const timeVal = pickTime(req.body);
  const occurredAt = toIsoDateTime(dateVal, timeVal);

  if (!title) return res.status(400).json({ message: "Title required" });
  if (!amount || Number.isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: "Amount must be greater than 0" });
  }
  if (!dateVal || !timeVal) {
    return res.status(400).json({ message: "Date and time are required" });
  }

  const receiptPath = req.file ? "/uploads/receipts/" + path.basename(req.file.path) : null;
  const breakdown = breakdownArr.length ? JSON.stringify(breakdownArr) : null;

  db.run(
    `INSERT INTO expenses (
      userId, title, amount, currency, section, category, subCategory,
      paymentMethod, notes, occurredAt, receipt, chartType, smartArtType, breakdown, createdAt
    )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      userId,
      title,
      amount,
      currency,
      section,
      category,
      subCategory,
      paymentMethod,
      notes,
      occurredAt,
      receiptPath,
      chartType,
      smartArtType,
      breakdown,
    ],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });
      logActivity(userId, "expense", `Added expense: ${title} (${currency} ${amount})`);
      res.json({ success: true, id: this.lastID });
    }
  );
});

// PUT /api/expenses/:id (requires active subscription)
router.put("/:id", upload.single("receipt"), requireSubscription, (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const id = req.params.id;

  const title = (req.body.title || "").trim();
  const amount = Number(req.body.amount);
  const currency = (req.body.currency || "PKR").toUpperCase();
  const section = normalizeSection(req.body.section);
  const category = (req.body.category || "").trim();
  const subCategory = (req.body.subCategory || "").trim();
  const paymentMethod = (req.body.paymentMethod || "").trim();
  const notes = (req.body.notes || "").trim();

  const chartType = String(req.body.chartType || "none").toLowerCase();
  const smartArtType = String(req.body.smartArtType || "none").toLowerCase();
  const breakdownArr = normalizeBreakdown(req.body.breakdown);

  const dateVal = pickDate(req.body);
  const timeVal = pickTime(req.body);
  const occurredAt = toIsoDateTime(dateVal, timeVal);

  const receiptPath = req.file ? "/uploads/receipts/" + path.basename(req.file.path) : null;

  if (!title) return res.status(400).json({ message: "Title required" });
  if (!amount || Number.isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: "Amount must be greater than 0" });
  }
  if (!dateVal || !timeVal) {
    return res.status(400).json({ message: "Date and time are required" });
  }

  const breakdown = breakdownArr.length ? JSON.stringify(breakdownArr) : null;

  db.get(`SELECT receipt FROM expenses WHERE id=? AND userId=?`, [id, userId], (e0, existing) => {
    if (e0) return res.status(500).json({ message: e0.message });
    if (!existing) return res.status(404).json({ message: "Expense not found" });

    const finalReceipt = receiptPath || existing.receipt || null;

    db.run(
      `UPDATE expenses
       SET title=?, amount=?, currency=?, section=?, category=?, subCategory=?, paymentMethod=?, notes=?, occurredAt=?, receipt=?,
           chartType=?, smartArtType=?, breakdown=?, updatedAt=datetime('now')
       WHERE id=? AND userId=?`,
      [
        title,
        amount,
        currency,
        section,
        category,
        subCategory,
        paymentMethod,
        notes,
        occurredAt,
        finalReceipt,
        chartType,
        smartArtType,
        breakdown,
        id,
        userId,
      ],
      function (err) {
        if (err) return res.status(500).json({ message: err.message });
        logActivity(userId, "expense", `Edited expense: ${title} (${currency} ${amount})`);
        res.json({ success: true });
      }
    );
  });
});

// ✅ NEW: POST /api/expenses/:id/add  (increment amount + breakdown)
router.post("/:id/add", requireSubscription, (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const id = req.params.id;
  const delta = Number(req.body.amountDelta);

  if (!delta || Number.isNaN(delta) || delta <= 0) {
    return res.status(400).json({ message: "amountDelta must be greater than 0" });
  }

  const addLabel = String(req.body.breakdownLabel || "").trim();
  const addValue = Number(req.body.breakdownValue);

  db.get(
    `SELECT id, title, currency, amount, breakdown FROM expenses WHERE id=? AND userId=?`,
    [id, userId],
    (e0, row) => {
      if (e0) return res.status(500).json({ message: e0.message });
      if (!row) return res.status(404).json({ message: "Expense not found" });

      const newAmount = Number(row.amount || 0) + delta;

      let breakdownArr = normalizeBreakdown(row.breakdown);

      // if user provided breakdown item, merge it
      if (addLabel && addValue && Number.isFinite(addValue) && addValue > 0) {
        const idx = breakdownArr.findIndex((x) => x.label.toLowerCase() === addLabel.toLowerCase());
        if (idx >= 0) breakdownArr[idx].value = Number(breakdownArr[idx].value || 0) + addValue;
        else breakdownArr.push({ label: addLabel, value: addValue });
      }

      const breakdown = breakdownArr.length ? JSON.stringify(breakdownArr) : null;

      db.run(
        `UPDATE expenses SET amount=?, breakdown=?, updatedAt=datetime('now') WHERE id=? AND userId=?`,
        [newAmount, breakdown, id, userId],
        function (err) {
          if (err) return res.status(500).json({ message: err.message });
          logActivity(
            userId,
            "expense",
            `Added to expense: ${row.title} (+${row.currency} ${delta})`
          );
          res.json({ success: true, amount: newAmount, breakdown });
        }
      );
    }
  );
});

// DELETE /api/expenses/:id
router.delete("/:id", requireSubscription, (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const id = req.params.id;

  db.get(`SELECT title, currency, amount FROM expenses WHERE id=? AND userId=?`, [id, userId], (e0, row) => {
    if (e0) return res.status(500).json({ message: e0.message });
    if (!row) return res.status(404).json({ message: "Expense not found" });

    db.run(`DELETE FROM expenses WHERE id=? AND userId=?`, [id, userId], function (err) {
      if (err) return res.status(500).json({ message: err.message });
      logActivity(userId, "expense", `Deleted expense: ${row.title} (${row.currency} ${row.amount})`);
      res.json({ success: true });
    });
  });
});

// Export Excel
router.get("/export/excel", requireSubscription, async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const id = req.query.id;
  const section = String(req.query.section || "all").toLowerCase();

  let sql = `SELECT * FROM expenses WHERE userId=?`;
  const params = [userId];

  if (section !== "all") {
    sql += ` AND section=?`;
    params.push(normalizeSection(section));
  }
  if (id) {
    sql += ` AND id=?`;
    params.push(id);
  }
  sql += ` ORDER BY datetime(occurredAt) DESC, id DESC`;

  db.all(sql, params, async (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    logActivity(userId, "export", id ? `Exported Excel for expense #${id}` : `Exported Excel (${section})`);
    const fname = id ? `expense_${id}.xlsx` : `expenses_${section}.xlsx`;
    await exportExcel(res, fname, rows || []);
  });
});

// Export PDF
router.get("/export/pdf", requireSubscription, (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const id = req.query.id;
  const section = String(req.query.section || "all").toLowerCase();

  let sql = `SELECT * FROM expenses WHERE userId=?`;
  const params = [userId];

  if (section !== "all") {
    sql += ` AND section=?`;
    params.push(normalizeSection(section));
  }
  if (id) {
    sql += ` AND id=?`;
    params.push(id);
  }
  sql += ` ORDER BY datetime(occurredAt) DESC, id DESC`;

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    logActivity(userId, "export", id ? `Exported PDF for expense #${id}` : `Exported PDF (${section})`);
    const fname = id ? `expense_${id}.pdf` : `expenses_${section}.pdf`;
    exportPdf(res, fname, rows || [], id ? `Expense #${id}` : `Expenses (${section})`);
  });
});

module.exports = router;
