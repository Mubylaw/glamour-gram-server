const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const { scheduleMeeting } = require("../utils/calendarApi");

// @desc    Schedule a appointment
// @route   POST /api/v1/appointments
// @access  Private
exports.scheduleAppointment = asyncHandler(async (req, res, next) => {
  const { mentorId, freetimeId, second } = req.body;
  const user = await User.findById(req.user.id);
  const mentor = await User.findById(mentorId);
  var scheduleTime = mentor.freeTime.find((el) => el._id == freetimeId);
  const field = await Field.findOne({ name: mentor.field });

  if (user.mentorHours < 1) {
    return next(new ErrorResponse(`You need to pay to schedule a call`, 404));
  }

  if (!mentor || !scheduleTime) {
    return next(
      new ErrorResponse(
        `Check values for mentorId and freeTimeId, something went wrong`,
        404
      )
    );
  }

  if (scheduleTime.free === false || (scheduleTime.freeT === false && second)) {
    return next(
      new ErrorResponse(
        `${mentor.firstName} is not available at this time`,
        404
      )
    );
  }

  const event = await scheduleMeeting(user, mentor, scheduleTime, second);

  if (!event) {
    return next(new ErrorResponse(`Couldn't Create event`, 404));
  }

  const userFieldsToUpdate = {
    mentorHours: user.mentorHours - 1,
  };

  await User.findByIdAndUpdate(req.user.id, userFieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  const date = new Date(event.end.dateTime);
  const endDate = new Date();
  const secs = date - endDate;

  if (second) {
    scheduleTime.freeT = false;
  } else {
    scheduleTime.free = false;
  }

  const resetTime = asyncHandler(async () => {
    if (second) {
      scheduleTime.freeT = true;
    } else {
      scheduleTime.free = true;
    }
    const freeTime = mentor.freeTime;
    var newTime = freeTime.filter((el) => el._id === freetimeId);
    newTime = [...newTime, scheduleTime];

    const fieldsToUpdate = {
      freeTime: newTime,
    };

    const use = await User.findByIdAndUpdate(mentorId, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });
  });

  setTimeout(resetTime, secs);

  const freeTime = mentor.freeTime;
  var newTime = freeTime.filter((el) => el._id === freetimeId);
  newTime = [...newTime, scheduleTime];

  const fieldsToUpdate = {
    mentorHours: mentor.mentorHours + 1,
    mentorBalance: mentor.mentorBalance + field.price,
    freeTime: newTime,
  };

  await User.findByIdAndUpdate(mentorId, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  const appointmentObj = {
    mentor: mentorId,
    mentee: req.user.id,
    name: event.summary,
    eventId: event.id,
    time: event.start.dateTime,
    htmlLink: event.htmlLink,
    meetLink: event.hangoutLink,
    purpose: userT.clarity[userT.clarity.length - 1],
  };

  const appointment = await Appointment.create(appointmentObj);

  res.status(201).json({
    success: true,
    data: appointment,
  });
});

// @desc    Get All Appointments
// @route   GET /api/v1/appointments
// @access  Private/Admin
exports.getAppointments = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get a single Appointment
// @route   GET /api/v1/appointments/:id
// @access  Private/Admin
exports.getAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    return next(
      new ErrorResponse(
        `Appointment not found with id of ${req.params.id}`,
        404
      )
    );
  }

  res.status(200).json({
    success: true,
    data: appointment,
  });
});

// @desc    Update appointment
// @route   PUT /api/v1/appointments/:id
// @access  Private
exports.updateAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    return next(
      new ErrorResponse(
        `Appointment not found with id of ${req.params.id}`,
        404
      )
    );
  }

  // make sure user is appointment owner
  if (
    appointment.mentee != req.user.id &&
    appointment.mentor != req.user.id &&
    req.user.role !== "admin"
  ) {
    return next(
      new ErrorResponse(
        `User ${req.params.id} is not authorized to Update this appointment`,
        401
      )
    );
  }

  const newAppointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    data: newAppointment,
  });
});

// @desc    Delete appointment
// @route   DELETE /api/v1/appointments/:id
// @access  Private/Admin
exports.deleteAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    return next(
      new ErrorResponse(
        `Appointment not found with id of ${req.params.id}`,
        404
      )
    );
  }

  await Appointment.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
  });
});
