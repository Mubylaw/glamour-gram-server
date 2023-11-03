const express = require("express");
const multer = require("multer");
const upload = multer({
  dest: "temp/",
  limits: { fieldSize: 8 * 1024 * 1024 },
  array: true,
}).fields([
  {
    name: "portfolio",
    maxCount: 4,
  },
]);
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/users");

const User = require("../models/User");

const router = express.Router({ mergeParams: true });

// Protect middleware
const { protect, authorize } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");

router.use(protect);

router.post("/", authorize("admin"), createUser);
router.get("/", advancedResults(User), getUsers);
router
  .route("/:id")
  .get(getUser)
  .put(upload, updateUser)
  .delete(authorize("admin"), deleteUser);

module.exports = router;
