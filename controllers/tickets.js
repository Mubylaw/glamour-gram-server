const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Ticket = require("../models/Ticket");

// @desc    Get All Tickets
// @route   GET /api/v1/ticket
// @access  Private / admin
exports.getTickets = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get a single Ticket
// @route   GET /api/v1/ticket/:id
// @access  Private / admin
exports.getTicket = asyncHandler(async (req, res, next) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    return next(
      new ErrorResponse(`Ticket not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: ticket,
  });
});

// @desc    Create ticket
// @route   POST /api/v1/ticket
// @access  Public
exports.createTicket = asyncHandler(async (req, res, next) => {
  const bokks = await Ticket.find({ user: req.user.id }).select("no");
  req.body.no = bokks.length + 1;
  req.body.user = req.user.id;
  const ticket = await Ticket.create(req.body);

  res.status(201).json({
    success: true,
    data: ticket,
  });
});

// @desc    Update ticket details
// @route   PUT /api/v1/ticket/:id
// @access  Private
exports.updateTicket = asyncHandler(async (req, res, next) => {
  if (req.body.role === "admin" && req.ticket.role !== "admin") {
    return next(
      new ErrorResponse(`You are not authorized to make that change`, 404)
    );
  }

  req.body.updated = Date.now();

  const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: ticket,
  });
});

// @desc    Delete ticket
// @route   DELETE /api/v1/tickets/:id
// @access  Private/Admin
exports.deleteTicket = asyncHandler(async (req, res, next) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    return next(
      new ErrorResponse(`Ticket not found with id of ${req.params.id}`, 404)
    );
  }

  await Ticket.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
  });
});
