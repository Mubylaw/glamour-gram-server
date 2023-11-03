const express = require("express");
const {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
} = require("../controllers/bookings");

const Booking = require("../models/Booking");

const router = express.Router({ mergeParams: true });

// Protect middleware
const { protect, authorize } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");

router.use(protect);

router.post("/", createBooking);
router.get("/", advancedResults(Booking), getBookings);
router
  .route("/:id")
  .get(getBooking)
  .put(updateBooking)
  .delete(authorize("admin"), deleteBooking);

module.exports = router;
