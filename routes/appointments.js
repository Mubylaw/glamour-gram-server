const express = require("express");
const {
  scheduleAppointment,
  getAppointments,
  getAppointment,
  updateAppointment,
  deleteAppointment,
} = require("../controllers/appointment");

const Appointment = require("../models/Appointment");

const router = express.Router({ mergeParams: true });

// Protect middleware
const { protect, authorize } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");

router.get("/", advancedResults(Appointment), getAppointments);

router.use(protect);

router.route("/").post(scheduleAppointment);

router
  .route("/:id")
  .get(getAppointment)
  .put(updateAppointment)
  .delete(authorize("admin"), deleteAppointment);

module.exports = router;
