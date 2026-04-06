const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.models.Item || mongoose.model('Item', itemSchema);
