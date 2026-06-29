const db = require("../config/db");
const excel = require("../utils/excelExport");
const pdf = require("../utils/pdfExport");

function logActivity(userId, type, message) {
  db.run(`INSERT INTO activities (userId,type,message) VALUES (?,?,?)`, [userId, type, message], () => {});
}

exports.addExpense = (req, res) => {
  const {
    userId,
    title,
    amount,
    currency,
    section,
    category,
    paymentMethod,
    expenseDate,
    expenseTime,
    notes,
  } = req.body;

  if (!userId || !title || !amount || !currency || !section || !category || !expenseDate || !expenseTime) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const iso = new Date(`${expenseDate}T${expenseTime}:00`).toISOString();
  const month = expenseDate.slice(0, 7);
  const receipt = req.file ? `/uploads/receipts/${req.file.filename}` : null;

  db.run(
    `
    INSERT INTO expenses 
    (userId,title,amount,currency,section,category,paymentMethod,expenseDateTime,notes,receipt,month)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `,
    [
      userId,
      title,
      Number(amount),
      currency,
      section.toLowerCase(),
      category,
      paymentMethod || null,
      iso,
      notes || null,
      receipt,
      month,
    ],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });

      logActivity(userId, "expense_add", `Expense added: ${title} (${currency} ${amount}).`);
      return res.json({ success: true, message: "Expense added", id: this.lastID });
    }
  );
};

exports.list = (req, res) => {
  const { userId, section = "general", month, category, search } = req.query;
  if (!userId) return res.status(400).json({ message: "userId required" });

  const wh = ["userId=?"];
  const pr = [userId];

  if (section) {
    wh.push("section=?");
    pr.push(section.toLowerCase());
  }
  if (month && month !== "all") {
    wh.push("month=?");
    pr.push(month);
  }
  if (category && category !== "all") {
    wh.push("category=?");
    pr.push(category);
  }
  if (search) {
    wh.push("(title LIKE ? OR notes LIKE ? OR category LIKE ?)");
    pr.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  db.all(
    `SELECT * FROM expenses WHERE ${wh.join(" AND ")} ORDER BY datetime(expenseDateTime) DESC`,
    pr,
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      return res.json(rows || []);
    }
  );
};

exports.updateExpense = (req, res) => {
  const { id } = req.params;
  const {
    userId,
    title,
    amount,
    currency,
    section,
    category,
    paymentMethod,
    expenseDate,
    expenseTime,
    notes,
  } = req.body;

  if (!userId) return res.status(400).json({ message: "userId required" });

  const iso = expenseDate && expenseTime ? new Date(`${expenseDate}T${expenseTime}:00`).toISOString() : null;
  const month = expenseDate ? expenseDate.slice(0, 7) : null;
  const receipt = req.file ? `/uploads/receipts/${req.file.filename}` : null;

  db.get(`SELECT * FROM expenses WHERE id=? AND userId=?`, [id, userId], (e0, row) => {
    if (e0) return res.status(500).json({ message: e0.message });
    if (!row) return res.status(404).json({ message: "Expense not found" });

    db.run(
      `
      UPDATE expenses SET
        title=?,
        amount=?,
        currency=?,
        section=?,
        category=?,
        paymentMethod=?,
        expenseDateTime=?,
        notes=?,
        receipt=COALESCE(?, receipt),
        month=?,
        updatedAt=datetime('now')
      WHERE id=? AND userId=?
      `,
      [
        title ?? row.title,
        Number(amount ?? row.amount),
        currency ?? row.currency,
        (section ?? row.section).toLowerCase(),
        category ?? row.category,
        paymentMethod ?? row.paymentMethod,
        iso ?? row.expenseDateTime,
        notes ?? row.notes,
        receipt,
        month ?? row.month,
        id,
        userId,
      ],
      function (err) {
        if (err) return res.status(500).json({ message: err.message });

        logActivity(userId, "expense_edit", `Expense updated: ${title ?? row.title}.`);
        return res.json({ success: true, message: "Updated" });
      }
    );
  });
};

exports.deleteExpense = (req, res) => {
  const { id } = req.params;
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ message: "userId required" });

  db.get(`SELECT title,currency,amount FROM expenses WHERE id=? AND userId=?`, [id, userId], (e0, row) => {
    if (e0) return res.status(500).json({ message: e0.message });
    if (!row) return res.status(404).json({ message: "Expense not found" });

    db.run(`DELETE FROM expenses WHERE id=? AND userId=?`, [id, userId], (err) => {
      if (err) return res.status(500).json({ message: err.message });

      logActivity(userId, "expense_delete", `Expense deleted: ${row.title} (${row.currency} ${row.amount}).`);
      return res.json({ success: true, message: "Deleted" });
    });
  });
};

exports.exportExcel = (req, res) => excel(req, res);
exports.exportPDF = (req, res) => pdf(req, res);
