const PDFDocument = require("pdfkit");
const db = require("../config/db");

function logActivity(userId, type, message) {
  db.run(`INSERT INTO activities (userId,type,message) VALUES (?,?,?)`, [userId, type, message], () => {});
}

module.exports = (req, res) => {
  const { userId, section, month, expenseId } = req.query;
  if (!userId) return res.status(400).json({ message: "userId required" });

  const doc = new PDFDocument({ margin: 36 });
  res.setHeader("Content-Type", "application/pdf");

  const filename = expenseId ? `expense_${expenseId}.pdf` : `expenses.pdf`;
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

  doc.pipe(res);
  doc.fontSize(18).text("Expense Report", { underline: true });
  doc.moveDown();

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
    (err, rows) => {
      if (err) {
        doc.text("Failed to load expenses.");
        doc.end();
        return;
      }

      rows.forEach((e) => {
        doc
          .fontSize(12)
          .text(
            `${e.title} | ${e.section} | ${e.category} | ${e.currency} ${e.amount} | ${new Date(e.expenseDateTime).toLocaleString()}`
          );
        if (e.notes) doc.fontSize(10).fillColor("gray").text(`Notes: ${e.notes}`).fillColor("black");
        doc.moveDown(0.4);
      });

      doc.end();

      logActivity(userId, "export_pdf", expenseId ? `Exported expense #${expenseId} (PDF).` : "Exported expenses (PDF).");
    }
  );
};
