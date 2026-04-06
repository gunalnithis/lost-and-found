const express = require("express");
const router = express.Router();
const {
  createAdvertisementTemplate,
  getAdvertisements,
  toggleAdvertisementFeatured,
  updateAdvertisement,
  deleteAdvertisement,
} = require("../controllers/advertisementController");

router.get("/", getAdvertisements);
router.post("/template", createAdvertisementTemplate);
router.patch("/:id/feature", toggleAdvertisementFeatured);
router.put("/:id", updateAdvertisement);
router.delete("/:id", deleteAdvertisement);
router.post("/:id/delete", deleteAdvertisement);

module.exports = router;
