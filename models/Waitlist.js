const mongoose = require("mongoose");

const WaitlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["customer", "business"],
      default: "customer",
    },
    services: [String],
    insta: String,
    phoneNo: String,
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

module.exports = mongoose.model("Waitlist", WaitlistSchema);
