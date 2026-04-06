const mongoose = require("mongoose");

const advertisementRequestSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ["lost", "found"],
    required: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    default: "",
    trim: true,
  },
  contactName: {
    type: String,
    required: true,
    trim: true,
  },
  contactEmail: {
    type: String,
    required: true,
    trim: true,
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true,
  },
  requestedByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  adminNote: {
    type: String,
    default: "",
    trim: true,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  reviewedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("AdvertisementRequest", advertisementRequestSchema);
