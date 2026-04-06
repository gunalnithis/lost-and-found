const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  itNumber: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  userType: {
    type: String,
    enum: ['student', 'lecture', 'others'],
    default: 'others',
  },
  profilePic: {
    type: String,
    default: "",
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },


  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
