const express = require("express");
const { createPayment } = require("../controllers/payment");

// const Payment = require("../models/Payment");

const router = express.Router({ mergeParams: true });

// Protect middleware
const { protect, authorize } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");

router.post("/", createPayment);
// router.get("/", advancedResults(Payment), getPayments);
// router
//   .route("/:id")
//   .get(getPayment)
//   .put(updatePayment)
//   .delete(authorize("admin"), deletePayment);

module.exports = router;
