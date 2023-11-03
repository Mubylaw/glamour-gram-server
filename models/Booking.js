const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
    no: {
      type: Number,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cancellation: {
      type: String,
    },
    rescheduling: {
      type: String,
    },
    noShow: {
      type: String,
    },
    deposit: {
      type: String,
    },
    client: {
      type: String,
    },
    general: {
      type: String,
    },
    business: {
      type: String,
    },
    active: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

module.exports = mongoose.model("Booking", BookingSchema);
