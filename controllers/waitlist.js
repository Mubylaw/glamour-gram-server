const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Waitlist = require("../models/Waitlist");

// @desc    Get All Waitlists
// @route   GET /api/v1/waitlist
// @access  Private / admin
exports.getWaitlists = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get a single Waitlist
// @route   GET /api/v1/waitlist/:id
// @access  Private / admin
exports.getWaitlist = asyncHandler(async (req, res, next) => {
  const waitlist = await Waitlist.findById(req.params.id);
  if (!waitlist) {
    return next(
      new ErrorResponse(`Waitlist not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: waitlist,
  });
});

// @desc    Create waitlist
// @route   POST /api/v1/waitlist
// @access  Public
exports.createWaitlist = asyncHandler(async (req, res, next) => {
  const bokks = await Waitlist.find({ user: req.user.id }).select("no");
  req.body.no = bokks.length + 1;
  req.body.user = req.user.id;
  const waitlist = await Waitlist.create(req.body);

  res.status(201).json({
    success: true,
    data: waitlist,
  });
});

// @desc    Update waitlist details
// @route   PUT /api/v1/waitlist/:id
// @access  Private
exports.updateWaitlist = asyncHandler(async (req, res, next) => {
  if (req.body.role === "admin" && req.waitlist.role !== "admin") {
    return next(
      new ErrorResponse(`You are not authorized to make that change`, 404)
    );
  }

  req.body.updated = Date.now();

  const waitlist = await Waitlist.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: waitlist,
  });
});

// @desc    Delete waitlist
// @route   DELETE /api/v1/waitlists/:id
// @access  Private/Admin
exports.deleteWaitlist = asyncHandler(async (req, res, next) => {
  const waitlist = await Waitlist.findById(req.params.id);
  if (!waitlist) {
    return next(
      new ErrorResponse(`Waitlist not found with id of ${req.params.id}`, 404)
    );
  }

  await Waitlist.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
  });
});
