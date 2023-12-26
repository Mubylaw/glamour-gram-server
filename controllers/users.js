const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const User = require("../models/User");
const {
  getGeolocationFromAddress,
  calculateDistance,
} = require("../helpers/map");
const { uploadToS3 } = require("../utils/fileUploadService");

// @desc    Get All Users
// @route   GET /api/v1/user
// @access  Private / admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get All Businesses
// @route   GET /api/v1/user/business
// @access  Private / admin
exports.getBusinesses = asyncHandler(async (req, res, next) => {
  var businesses = await User.find({ role: "business" });

  if (req.body.location) {
    const location = await getGeolocationFromAddress(req.body.location);
    if (location && location.within) {
      req.body.latitude = location.latitude;
      req.body.longitude = location.longitude;
    }
  }

  if (req.body.distance && req.body.longitude) {
    businesses = businesses
      .map((business) => ({
        ...business._doc,
        distance: calculateDistance(
          req.body.latitude,
          req.body.longitude,
          business.latitude,
          business.longitude
        ),
      }))
      .filter((business) => business.distance <= req.body.distance)
      .sort((a, b) => a.distance - b.distance);
  }

  res.status(200).json({
    success: true,
    data: businesses,
  });
});

// @desc    Get a single User
// @route   GET /api/v1/user/:id
// @access  Private / admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate(req.query.populate);
  if (!user) {
    return next(new ErrorResponse(`User not found`, 404));
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Create user
// @route   POST /api/v1/user
// @access  Public
exports.createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: user,
  });
});

// @desc    Update user details
// @route   PUT /api/v1/user/:id
// @access  Private
exports.updateUser = asyncHandler(async (req, res, next) => {
  if (req.body.location) {
    const location = await getGeolocationFromAddress(req.body.location);
    if (!location || !location.within) {
      return next(
        new ErrorResponse(
          `Please enter an address that is in the UK or Ireland`,
          400
        )
      );
    }
    req.body.latitude = location.latitude;
    req.body.longitude = location.longitude;
  }

  const oldUser = await User.findById(req.params.id);

  if (req.files) {
    const file = req.files.portfolio[0];
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

    const portfolio = await uploadToS3({
      file: req.files.portfolio,
      folderName: "glamor portfolio",
    });
    if (oldUser.portfolio) {
      req.body.portfolio = [portfolio[0], ...oldUser.portfolio];
    } else {
      req.body.portfolio = [portfolio[0]];
    }
  }

  if (req.body.pin) {
    var pinArray = oldUser.pin;
    var portfolioArray = oldUser.portfolio;
    if (pinArray.length < 5) {
      pinArray.push(req.body.pin);
    } else {
      const removedItem = pinArray.shift();
      portfolioArray = portfolioArray.filter((item) => item !== removedItem);
      pinArray.push(req.body.pin);
    }
    portfolioArray = portfolioArray.filter((item) => item !== req.body.pin);
    req.body.pin = pinArray;
    req.body.portfolio = portfolioArray;
  }

  if (req.body.unpin) {
    var pinArray = oldUser.pin;
    var portfolioArray = oldUser.portfolio;
    pinArray = pinArray.filter((item) => item !== req.body.unpin);
    portfolioArray.push(req.body.unpin);
    req.body.pin = pinArray;
    req.body.portfolio = portfolioArray;
  }

  if (req.body.category && !req.body.removeService) {
    var item = oldUser.category;
    if (item) {
      var category = item.find((e) => {
        return e.id === req.body.catId;
      });
      if (category) {
        if (category.name !== req.body.category) {
          category.service = category.service.filter(
            (ser) => ser.name !== req.body.service
          );
          var newCategory = {
            name: req.body.category,
            service: [
              {
                name: req.body.service,
                price: req.body.price,
                time: req.body.time,
                tag: req.body.tag,
              },
            ],
          };
          item.push(newCategory);
        } else {
          var service = category.service.find((e) => {
            return e.name.toLowerCase() === req.body.service.toLowerCase();
          });
          if (service) {
            service.price = req.body.price;
            service.time = req.body.time;
            service.tag = req.body.tag;
          } else {
            category.service.push({
              name: req.body.service,
              price: req.body.price,
              time: req.body.time,
              tag: req.body.tag,
            });
          }
        }
      } else {
        var newCategory = {
          name: req.body.category,
          service: [
            {
              name: req.body.service,
              price: req.body.price,
              time: req.body.time,
              tag: req.body.tag,
            },
          ],
        };
        item.push(newCategory);
      }
    } else {
      item = [
        {
          name: req.body.category,
          service: {
            name: req.body.service,
            price: req.body.price,
            time: req.body.time,
            tag: req.body.tag,
          },
        },
      ];
    }
    req.body.category = item;
  }

  if (req.body.removeService) {
    var category = oldUser.category.find(
      (cat) => cat.name === req.body.category
    );
    if (category) {
      category.service = category.service.filter(
        (ser) => ser.name !== req.body.service
      );
      if (category.service.length === 0) {
        oldUser.category = oldUser.category.filter(
          (cat) => cat.name !== req.body.category
        );
      }
    }
    req.body.category = oldUser.category;
  }

  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Update free time
// @route   PUT /api/v1/users/freetime
// @access  Private
exports.addTime = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("freeTime");

  var freeTime = user.freeTime;
  req.body.freeTime.forEach((newTime) => {
    const { day, hour } = newTime;

    const isDuplicate = freeTime.some(
      (time) => time.day === day && time.hour === hour
    );

    if (!isDuplicate) {
      freeTime.push(newTime);
    }
  });

  const newUser = await User.findByIdAndUpdate(
    req.user.id,
    { freeTime },
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

// @desc    Delete free time
// @route   DELETE /api/v1/users/freetime/:id
// @access  Private
exports.removeTime = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("freeTime");

  var freeTime = user.freeTime;
  const foundTime = freeTime.findIndex((el) => el._id == req.params.id);
  if (foundTime === -1) {
    return next(
      new ErrorResponse(`Time not found with id of ${req.params.id}`, 404)
    );
  }
  freeTime.splice(foundTime, 1);

  await User.findByIdAndUpdate(
    req.user.id,
    { freeTime },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    data: user,
  });
});
