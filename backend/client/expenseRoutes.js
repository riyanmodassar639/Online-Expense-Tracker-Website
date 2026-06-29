const express = require("express");
const router = express.Router();
const expense = require("../controllers/expenseController");

router.post("/add", expense.addExpense);
router.get("/:userId/:month", expense.getExpensesByMonth);
router.put("/update/:id", expense.updateExpense);
router.delete("/delete/:id", expense.deleteExpense);
router.get("/excel/:userId/:month", expense.exportExcel);
router.get("/pdf/:userId/:month", expense.exportPDF);

module.exports = router;
