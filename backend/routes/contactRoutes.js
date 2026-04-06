const express = require("express");
const router = express.Router();
const {
	sendMessage,
	getLostContactRequests,
	getFoundContactRequests,
	updateLostContactRequestStatus,
	updateFoundContactRequestStatus,
	updateFoundContactRequest,
	deleteFoundContactRequest,
	getMyContactRequestNotifications,
	dismissContactRequestNotification,
} = require("../controllers/contactController");
const { createFeedback } = require("../controllers/feedbackController");
const { protect } = require("../middleware/auth");

router.post("/send-message", protect, sendMessage);
router.post("/feedback", createFeedback);
router.get("/lost-requests", getLostContactRequests);
router.get("/found-requests", getFoundContactRequests);
router.get("/notifications", protect, getMyContactRequestNotifications);
router.patch("/notifications/:category/:id/dismiss", protect, dismissContactRequestNotification);
router.patch("/lost-requests/:id/status", updateLostContactRequestStatus);
router.patch("/found-requests/:id/status", updateFoundContactRequestStatus);
router.put("/found-requests/:id", updateFoundContactRequest);
router.delete("/found-requests/:id", deleteFoundContactRequest);

module.exports = router;
