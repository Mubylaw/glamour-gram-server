const mongoose = require("mongoose");

const WaitlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
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

// custom error message
WaitlistSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    next(new Error("This email is already on the waitlist!"));
  } else {
    next(error);
  }
});

module.exports = mongoose.model("Waitlist", WaitlistSchema);
