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

const postItemSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  itemName: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    enum: ['lost', 'found'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional for now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved',
  },
  trackingStatus: {
    type: String,
    enum: trackingStatuses,
    default: function trackingStatusDefault() {
      return this.category === 'found' ? 'found' : undefined;
    },
  },
  timeline: {
    type: [timelineEntrySchema],
    default: function timelineDefault() {
      if (this.category !== 'found') {
        return [];
      }

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

module.exports = mongoose.model('PostItem', postItemSchema);
