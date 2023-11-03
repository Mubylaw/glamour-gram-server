const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Booking = require("../models/Booking");

// @desc    Get All Bookings
// @route   GET /api/v1/booking
// @access  Private / admin
exports.getBookings = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get a single Booking
// @route   GET /api/v1/booking/:id
// @access  Private / admin
exports.getBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return next(
      new ErrorResponse(`Booking not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: booking,
  });
});

// @desc    Create booking
// @route   POST /api/v1/booking
// @access  Public
exports.createBooking = asyncHandler(async (req, res, next) => {
  const bokks = await Booking.find({ user: req.user.id }).select("no");
  req.body.no = bokks.length + 1;
  req.body.user = req.user.id;
  const booking = await Booking.create(req.body);

  res.status(201).json({
    success: true,
    data: booking,
  });
});

// @desc    Update booking details
// @route   PUT /api/v1/booking/:id
// @access  Private
exports.updateBooking = asyncHandler(async (req, res, next) => {
  if (req.body.role === "admin" && req.booking.role !== "admin") {
    return next(
      new ErrorResponse(`You are not authorized to make that change`, 404)
    );
  }

  req.body.updated = Date.now();

  const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: booking,
  });
});

// @desc    Delete booking
// @route   DELETE /api/v1/bookings/:id
// @access  Private/Admin
exports.deleteBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return next(
      new ErrorResponse(`Booking not found with id of ${req.params.id}`, 404)
    );
  }

  await Booking.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
  });
});
