const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "Please add a first name"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Please add a last name"],
      trim: true,
    },
    username: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      trim: true,
    },
    industry: String,
    portfolio: [
      {
        type: String,
        unique: true,
        match: [
          /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/,
          "Please add a valid url",
        ],
      },
    ],
    pin: [
      {
        type: String,
        unique: true,
        match: [
          /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/,
          "Please add a valid url",
        ],
      },
    ],
    insta: {
      type: String,
      unique: true,
      match: [
        /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/,
        "Please add a valid url",
      ],
    },
    twitter: {
      type: String,
      unique: true,
      match: [
        /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/,
        "Please add a valid url",
      ],
    },
    facebook: {
      type: String,
      unique: true,
      match: [
        /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/,
        "Please add a valid url",
      ],
    },
    cert: String,
    about: String,
    male: {
      type: Boolean,
      default: false,
    },
    female: {
      type: Boolean,
      default: true,
    },
    emailNotification: {
      type: Boolean,
      default: true,
    },
    siteNotification: {
      type: Boolean,
      default: true,
    },
    smsNotification: {
      type: Boolean,
      default: true,
    },
    type: {
      type: String,
      enum: ["female", "male"],
      default: "female",
    },
    category: [
      new mongoose.Schema({
        name: {
          type: String,
          enum: [
            "Nails",
            "Makeup",
            "Skincare",
            "Massage",
            "Hair Removal",
            "Barber",
            "Aesthetics",
            "Hair",
          ],
        },
        service: [
          new mongoose.Schema(
            {
              name: String,
              price: Number,
              time: Number,
              tag: [String],
            },
            { _id: false }
          ),
        ],
      }),
    ],
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    address: String,
    homeService: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "business"],
      default: "user",
    },
    currency: {
      type: String,
      enum: ["euros", "pounds"],
      default: "euros",
    },
    password: {
      type: String,
      minLength: 6,
      select: false,
    },
    picture: {
      type: String,
      default: "no-user.jpg",
    },
    googleId: String,
    refreshToken: String,
    phoneNo: String,
    refreshToken: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    freeTime: [
      new mongoose.Schema({
        day: {
          type: Number,
          required: true,
          min: [0, "Day starts from 0"],
          max: [6, "Day cannot be more that 6"],
        },
        date: Number,
        month: Number,
        year: Number,
        hour: {
          type: Number,
          required: true,
        },
        endhour: {
          type: Number,
          required: true,
        },
        duration: {
          type: Number,
          required: true,
        },
        minute: {
          type: Number,
          required: true,
        },
        endminute: {
          type: Number,
          required: true,
        },
        zone: {
          type: String,
          required: true,
        },
      }),
    ],
    rating: {
      type: Number,
      min: 1,
      max: 500,
      default: 1,
    },
    favorite: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    priceType: {
      type: String,
      enum: ["flat", "percent"],
      default: "flat",
    },
    priceAmount: {
      type: Number,
      default: 0,
    },
    balance: {
      type: Number,
      default: 0,
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

// reverse populate with virtuals
UserSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "store",
  justOne: false,
});

// reverse populate with virtuals
UserSchema.virtual("booking", {
  ref: "Booking",
  localField: "_id",
  foreignField: "user",
});

// create slug from name
UserSchema.pre("save", function (next) {
  this.username = slugify(`${this.name}`, {
    lower: true,
  });
  next();
});

// encrypt password using bcryptjs
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// custom error message
UserSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoError" && error.code === 11000) {
    next(new Error("This account already exists"));
  } else {
    next(error);
  }
});

// sign jwt and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    {
      id: this._id,
      firstName: this.firstName,
      picture: this.picture,
      role: this.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE,
    }
  );
};

// match user entered password to hashed password in DB
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function () {
  // Generate Token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash Token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("User", UserSchema);
