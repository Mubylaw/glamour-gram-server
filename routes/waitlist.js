const express = require("express");
const {
  getWaitlists,
  getWaitlist,
  createWaitlist,
  updateWaitlist,
  deleteWaitlist,
} = require("../controllers/waitlists");

const Waitlist = require("../models/Waitlist");

const router = express.Router({ mergeParams: true });

// Protect middleware
const { protect, authorize } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");

router.post("/", createWaitlist);
router.use(protect);

router.get("/", advancedResults(Waitlist), getWaitlists);
router
  .route("/:id")
  .get(getWaitlist)
  .put(updateWaitlist)
  .delete(authorize("admin"), deleteWaitlist);

module.exports = router;
