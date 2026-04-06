const mongoose = require("mongoose");

const contactRequestSchema = new mongoose.Schema({
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ContactRequest", contactRequestSchema);
