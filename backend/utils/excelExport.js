const ExcelJS = require("exceljs");
const db = require("../config/db");

function logActivity(userId, type, message) {
  db.run(`INSERT INTO activities (userId,type,message) VALUES (?,?,?)`, [userId, type, message], () => {});
}

module.exports = async (req, res) => {
  const { userId, section, month, expenseId } = req.query;

  if (!userId) return res.status(400).json({ message: "userId required" });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Expenses");

  ws.columns = [
    { header: "Title", key: "title", width: 24 },
    { header: "Section", key: "section", width: 12 },
    { header: "Category", key: "category", width: 18 },
    { header: "Amount", key: "amount", width: 12 },
    { header: "Currency", key: "currency", width: 10 },
    { header: "Payment Method", key: "paymentMethod", width: 16 },
    { header: "Date/Time", key: "expenseDateTime", width: 22 },
    { header: "Notes", key: "notes", width: 30 },
    { header: "Receipt", key: "receipt", width: 30 },
  ];

  const wh = ["userId=?"];
  const pr = [userId];

  if (expenseId) {
    wh.push("id=?");
    pr.push(expenseId);
  } else {
    if (section) {
      wh.push("section=?");
      pr.push(section.toLowerCase());
    }
    if (month && month !== "all") {
      wh.push("month=?");
      pr.push(month);
    }
  }

  db.all(
    `SELECT * FROM expenses WHERE ${wh.join(" AND ")} ORDER BY datetime(expenseDateTime) DESC`,
    pr,
    async (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });

      rows.forEach((r) => ws.addRow(r));

      const filename = expenseId ? `expense_${expenseId}.xlsx` : `expenses.xlsx`;
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
      await wb.xlsx.write(res);
      res.end();

      logActivity(userId, "export_excel", expenseId ? `Exported expense #${expenseId} (Excel).` : "Exported expenses (Excel).");
    }
  );
};
