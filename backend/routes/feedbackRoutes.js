const express = require("express");
const router = express.Router();
const {
	createFeedback,
	getFeedbacks,
	deleteFeedback,
	updateFeedbackStatus,
	replyToFeedback,
	getFeedbackSummary,
	getFeedbackAnalytics,
} = require("../controllers/feedbackController");

router.post("/", createFeedback);
router.get("/", getFeedbacks);
router.get("/summary", getFeedbackSummary);
router.get("/analytics", getFeedbackAnalytics);
router.patch("/:id/status", updateFeedbackStatus);
router.post("/:id/reply", replyToFeedback);
router.delete("/:id", deleteFeedback);

module.exports = router;
