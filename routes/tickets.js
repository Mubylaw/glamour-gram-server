const express = require("express");
const {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
} = require("../controllers/tickets");

const Ticket = require("../models/Ticket");

const router = express.Router({ mergeParams: true });

// Protect middleware
const { protect, authorize } = require("../middleware/auth");
const advancedResults = require("../middleware/advancedResults");

router.use(protect);

router.post("/", createTicket);
router.get("/", advancedResults(Ticket), getTickets);
router
  .route("/:id")
  .get(getTicket)
  .put(updateTicket)
  .delete(authorize("admin"), deleteTicket);

module.exports = router;
