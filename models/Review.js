const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    rating: { type: Number, min: 1, max: 5 },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
    },
    message: {
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

module.exports = mongoose.model("Review", ReviewSchema);
