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
  image: String,
  eventId: String,
  time: Date,
  endTime: Date,
  duration: Number,
  htmlLink: String,
  meetLink: String,
  purpose: String,
  price: Number,
  storeQuery: String,
  userQuery: String,
  storeRating: {
    type: mongoose.Schema.ObjectId,
    ref: "Review",
  },
  state: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Appointment", AppointmentSchema);
