const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  name: String,
  eventId: String,
  time: Date,
  htmlLink: String,
  meetLink: String,
  purpose: String,
  storeQuery: String,
  userQuery: String,
  storeRating: {
    type: mongoose.Schema.ObjectId,
    ref: "Review",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Appointment", AppointmentSchema);
