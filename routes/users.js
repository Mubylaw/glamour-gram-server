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
  addTime,
  removeTime,
  getBusinesses,
} = require("../controllers/users");

const User = require("../models/User");

const router = express.Router({ mergeParams: true });

// Protect middleware
const { protect, authorize } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");

router.post("/", protect, authorize("admin"), createUser);
router.get("/", advancedResults(User), getUsers);
router.post("/business", getBusinesses);
router.put("/freetime", protect, addTime);
router.delete("/freetime/:id", protect, removeTime);
router.get("/:id", getUser);
router
  .route("/:id")
  .put(upload, protect, updateUser)
  .delete(protect, authorize("admin"), deleteUser);

module.exports = router;
