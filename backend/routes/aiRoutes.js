const express = require("express");
const { chatWithGemini, getAiStatus } = require("../controllers/aiController");

const router = express.Router();

router.get("/status", getAiStatus);
router.post("/chat", chatWithGemini);

module.exports = router;
