const mongoose = require("mongoose");

const advertisementSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AdvertisementRequest",
    sparse: true,
    unique: true,
  },
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
  source: {
    type: String,
    enum: ["request", "template"],
    default: "request",
  },
  featured: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Advertisement", advertisementSchema);
