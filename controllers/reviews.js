const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Review = require("../models/Review");

// @desc    Get All Reviews
// @route   GET /api/v1/review
// @access  Private / admin
exports.getReviews = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get a single Review
// @route   GET /api/v1/review/:id
// @access  Private / admin
exports.getReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return next(
      new ErrorResponse(`Review not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: review,
  });
});

// @desc    Create review
// @route   POST /api/v1/review
// @access  Public
exports.createReview = asyncHandler(async (req, res, next) => {
  req.body.user = req.user.id;
  const review = await Review.create(req.body);

  res.status(201).json({
    success: true,
    data: review,
  });
});

// @desc    Update review details
// @route   PUT /api/v1/review/:id
// @access  Private
exports.updateReview = asyncHandler(async (req, res, next) => {
  if (req.body.role === "admin" && req.review.role !== "admin") {
    return next(
      new ErrorResponse(`You are not authorized to make that change`, 404)
    );
  }

  const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: review,
  });
});

// @desc    Delete review
// @route   DELETE /api/v1/reviews/:id
// @access  Private/Admin
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return next(
      new ErrorResponse(`Review not found with id of ${req.params.id}`, 404)
    );
  }

  await Review.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
  });
});
