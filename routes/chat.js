const express = require("express");
const { createVectorStore, askQuestion } = require("../controllers/chat");

const router = express.Router({ mergeParams: true });

// Protect middleware
const { protect } = require("../middleware/auth");

router.use(protect);

router.post("/store", createVectorStore);
router.post("/", askQuestion);

module.exports = router;
