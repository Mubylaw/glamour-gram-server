const express = require("express");
const {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
} = require("../controllers/reviews");

const Review = require("../models/Review");

const router = express.Router({ mergeParams: true });

// Protect middleware
const { protect, authorize } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");

router.use(protect);

router.post("/", createReview);
router.get("/", advancedResults(Review), getReviews);
router
  .route("/:id")
  .get(getReview)
  .put(updateReview)
  .delete(authorize("admin"), deleteReview);

module.exports = router;
