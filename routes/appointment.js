const express = require("express");
const {
  getMentor,
  getOneMentor,
  scheduleMeeting,
  getMeetings,
  getMeeting,
  updateMeeting,
  deleteMeeting,
  getMentorMeetings,
  getMenteeMeetings,
} = require("../controllers/meeting");

const Meeting = require("../models/Meeting");

const router = express.Router({ mergeParams: true });

// Protect middleware
const { protect, authorize } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");

router.use(protect);

router.route("/field/:field").get(getMentor);
router.route("/singlementor/:id").get(getOneMentor);

router
  .route("/")
  .get(authorize("admin"), advancedResults(Meeting), getMeetings)
  .post(scheduleMeeting);

router
  .route("/:id")
  .get(authorize("admin"), getMeeting)
  .put(updateMeeting)
  .delete(authorize("admin"), deleteMeeting);

router.get("/mentor/:id", authorize("admin", "mentor"), getMentorMeetings);
router.get("/mentee/:id", authorize("admin", "user"), getMenteeMeetings);

module.exports = router;
