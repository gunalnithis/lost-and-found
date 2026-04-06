const express = require("express");
const router = express.Router();
const {
  createAdvertisementRequest,
  getAdvertisementRequests,
  updateAdvertisementRequestStatus,
} = require("../controllers/advertisementController");

router.post("/", createAdvertisementRequest);
router.get("/", getAdvertisementRequests);
router.patch("/:id/status", updateAdvertisementRequestStatus);

module.exports = router;
