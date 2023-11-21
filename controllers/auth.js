const crypto = require("crypto");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const {
  getGoogleAuthURL,
  getGoogleUser,
  sendTokenResponse,
} = require("../helpers/authHelpers");
const { uploadToS3 } = require("../utils/fileUploadService");
const User = require("../models/User");
const axios = require("axios");

// @desc    Register User
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  // Create User
  req.body.email = req.body.email.replace(/\s/g, "");
  const user = await User.create(req.body);

  // send email
  const send_email_url = "https://api.brevo.com/v3/smtp/email";

  const options = JSON.stringify({
    sender: {
      name: "GlamorGram",
      email: "info@glamorgram.com",
    },
    to: [
      {
        email: `${user.email}`,
        name: `${user.firstName} ${user.lastName}`,
      },
    ],
    subject: "Welcome to GlamorGram",
    htmlContent:
      "<html><head></head><body><p>Hello,</p>Welcome to GlamorGram</p></body></html>",
  });

  const email = await axios(send_email_url, {
    method: "POST",
    data: options,
    headers: {
      "api-key": `${process.env.BREVO_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  sendTokenResponse(user, 200, res);
});

// @desc    Login User
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  var { email, password } = req.body;

  // Validate email and password
  if (!email || !password) {
    return next(new ErrorResponse("Please provide an email and password", 400));
  }

  // Check for user
  email = email.replace(/\s/g, "");
  var user = await User.findOne({ email: email.toLowerCase() }).select(
    `+password`
  );

  if (!user) {
    return next(new ErrorResponse("Email or password incorrect", 401));
  }

  // check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse("Email or password incorrect", 401));
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Log user out / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update Password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select(`+password`);

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse("Password is incorrect", 400));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  // Validate email
  if (!req.body.email) {
    return next(new ErrorResponse("Please provide an email", 400));
  }

  const user = await User.findOne({
    email: req.body.email.toLowerCase(),
  }).select("id");

  if (!user) {
    return next(new ErrorResponse("There is no user by that email", 404));
  }

  // get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/resetpassword/${resetToken}`;

  // const message = `You are receiving this email because you (or someone else) has
  //    requested the reset of a password. Please make a put request to: \n\n ${resetUrl}`

  res.status(200).json({
    success: true,
    data: resetUrl,
  });
});

// @desc    Reset Password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed passwords
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select("resetPasswordToken resetPasswordExpire +password");

  if (!user) {
    return next(new ErrorResponse("Invalid Token", 400));
  }

  // set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Upload avatar for a user
// @route   PUT /api/v1/auth/avatar
// @access  Private
exports.userPhotoUpload = asyncHandler(async (req, res, next) => {
  if (!req.files.avatar) {
    return next(new ErrorResponse(`Please upload an image`), 400);
  }
  const file = req.files.avatar[0];
  // make sure that the image is a photo
  if (!file.mimetype.startsWith("image")) {
    return next(new ErrorResponse(`Please upload an image file`, 400));
  }

  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please Upload an image file less than ${
          process.env.MAX_FILE_UPLOAD / 1000000
        }mb`,
        400
      )
    );
  }

  const avatar = await uploadToS3({
    file: req.files.avatar,
    folderName: "glamour avatar",
  });

  const newUser = await User.findByIdAndUpdate(
    req.user.id,
    { picture: avatar[0] },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    data: newUser,
  });
});

// @desc    Google Url
// @route   GET /api/v1/auth/googleurl
// @access  Public
exports.googleUrl = asyncHandler(async (req, res, next) => {
  const googleUrl = getGoogleAuthURL();

  res.status(200).json({
    success: true,
    data: googleUrl,
  });
});

// @desc    Register User with Google
// @route   GET /api/v1/auth/google
// @access  Public
exports.googleLogin = asyncHandler(async (req, res, next) => {
  const googleCode = req.query.code;
  const googleUser = await getGoogleUser({ code: googleCode });

  // Check for user
  const user = await User.findOne({ email: googleUser.email }).select("id");

  if (!user) {
    // Create User
    const user = await User.create({
      firstName: googleUser.given_name,
      lastName: googleUser.family_name,
      email: googleUser.email,
      password: "null",
      role: "user",
      picture: googleUser.picture || "no-user.jpg",
      googleId: googleUser.id,
      refreshToken: googleUser.tokens.refresh_token,
    });

    sendTokenResponse(user, 200, res);
  }

  if (googleUser.tokens.refresh_token) {
    var fieldsToUpdate = {
      refreshToken: googleUser.tokens.refresh_token,
      googleId: googleUser.id,
    };
  }

  const newUser = await User.findByIdAndUpdate(user._id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  sendTokenResponse(newUser, 200, res);
});
