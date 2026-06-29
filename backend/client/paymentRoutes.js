const express = require("express");
const router = express.Router();
const payment = require("../controllers/paymentController");

router.post("/submit", payment.upload, payment.submitPayment);
module.exports = router;
