const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema(
  {
    no: Number,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    subject: {
      type: String,
    },
    description: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

module.exports = mongoose.model("Ticket", TicketSchema);
