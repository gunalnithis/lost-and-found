const mongoose = require("mongoose");

const lostContactRequestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  itNumber: {
    type: String,
    required: true,
  },
  studyingYear: {
    type: String,
    required: true,
  },
  message: {
    type: String,
  },
  itemName: {
    type: String,
  },
  itemOwnerEmail: {
    type: String,
    required: true,
  },
  itemOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  reviewedAt: {
    type: Date,
  },
  dismissedByRequester: {
    type: Boolean,
    default: false,
  },
  dismissedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("LostContactRequest", lostContactRequestSchema);
