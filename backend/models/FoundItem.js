const mongoose = require('mongoose');

const trackingStatuses = ['found', 'contacted', 'claim_requested', 'verifying', 'returned'];

const timelineEntrySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: trackingStatuses,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false },
);

const foundItemSchema = new mongoose.Schema({
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
  dateFound: {
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
    enum: trackingStatuses,
    default: 'found',
  },
  timeline: {
    type: [timelineEntrySchema],
    default: function timelineDefault() {
      return [
        {
          status: 'found',
          timestamp: this.createdAt || new Date(),
          note: 'Item posted as found.',
        },
      ];
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('FoundItem', foundItemSchema);
