const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  name: {
    type: String,
    default: "Anonymous",
    trim: true,
  },
  email: {
    type: String,
    default: "",
    trim: true,
    lowercase: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  category: {
    type: String,
    enum: ["bug", "suggestion", "general"],
    default: "general",
  },
  status: {
    type: String,
    enum: ["pending", "reviewed", "replied"],
    default: "pending",
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  reply: {
    message: {
      type: String,
      trim: true,
      default: "",
    },
    repliedAt: {
      type: Date,
      default: null,
    },
    repliedBy: {
      type: String,
      trim: true,
      default: "admin",
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.Feedback || mongoose.model("Feedback", feedbackSchema);
