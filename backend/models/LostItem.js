const mongoose = require('mongoose');

const lostItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  dateLost: {
    type: Date,
    required: true,
  },
  contactInfo: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  contactNumber: {
    type: String,
  },
  image: {
    type: String, // URL to the image
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['lost', 'found', 'returned'],
    default: 'lost',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('LostItem', lostItemSchema);
